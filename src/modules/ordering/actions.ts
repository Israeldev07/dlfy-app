"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { cartQuoteSchema, checkoutSchema } from "@/lib/validations/checkout";
import { consumeRateLimit } from "@/lib/rate-limit";
import { retryAfterLabel } from "@/lib/rate-limit-rules";
import { formatUsd } from "@/modules/catalog/categories";
import { adminNewOrderMessage, sanitizeStoreNotes, storeRequestMessage } from "@/modules/messaging/messages";
import { buildActionPayload } from "@/modules/messaging/action-payload";
import { adminPhone, dispatchOutbox, enqueue } from "@/modules/messaging/outbox";
import type { CartQuote } from "./cart-sync";
import { computeTotals, deliveryFeeCents, generatePublicCode } from "./domain";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  /** Lo que escribió el cliente, para no perderlo si hay un error. */
  values?: Record<string, string>;
  /** Precios actuales cuando el carrito quedó desactualizado, para ponerlo al día. */
  quote?: CartQuote;
  /** Envío vigente, por si cambió desde que se abrió la página. */
  deliveryFeeCents?: number;
};

const KEPT_FIELDS = ["addressLine", "sector", "reference", "phone", "notes", "paymentMethod", "ageConfirmed"] as const;

/** Productos disponibles (con precio de la BD) de un comercio activo. */
function availableProducts(storeId: string, productIds: string[]) {
  return prisma.product.findMany({
    where: { storeId, isAvailable: true, store: { isActive: true }, id: { in: productIds } },
    select: { id: true, name: true, priceCents: true },
  });
}

function toQuote(storeId: string, products: { id: string; name: string; priceCents: number }[]): CartQuote {
  return { storeId, products: products.map((p) => ({ productId: p.id, name: p.name, priceCents: p.priceCents })) };
}

/**
 * Precios y disponibilidad actuales de lo que hay en el carrito. Solo informa al navegador:
 * el cobro se recalcula siempre en `createOrderAction`.
 */
export async function quoteCartAction(input: unknown): Promise<{ quote?: CartQuote }> {
  const session = await auth();
  if (!session?.user?.id) return {};
  const parsed = cartQuoteSchema.safeParse(input);
  if (!parsed.success) return {};
  const { storeId, productIds } = parsed.data;
  return { quote: toQuote(storeId, await availableProducts(storeId, productIds)) };
}

export async function createOrderAction(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/checkout");
  const userId = session.user.id;

  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = Object.fromEntries(KEPT_FIELDS.map((k) => [k, typeof raw[k] === "string" ? raw[k] : ""]));
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
    return { fieldErrors, error: fieldErrors.items ?? fieldErrors.storeId ?? fieldErrors.expectedTotalCents, values };
  }
  const input = parsed.data;

  const store = await prisma.store.findFirst({
    where: { id: input.storeId, isActive: true },
    select: { id: true, name: true, category: true, city: true, whatsappPhone: true },
  });
  if (!store) return { error: "Este comercio ya no está disponible.", values };

  if (store.category === "LIQUOR" && input.ageConfirmed !== "on") {
    return { fieldErrors: { ageConfirmed: "Debes confirmar que eres mayor de 18 años." }, values };
  }

  // Precios SIEMPRE desde la base de datos, nunca desde el navegador.
  const products = await availableProducts(store.id, input.items.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));
  if (input.items.some((i) => !byId.has(i.productId))) {
    return {
      error: "Algunos productos ya no están disponibles. Revisa tu carrito.",
      values,
      quote: toQuote(store.id, products),
    };
  }

  const lines = input.items.map((i) => {
    const product = byId.get(i.productId)!;
    return { productId: product.id, nameSnapshot: product.name, unitPriceCents: product.priceCents, quantity: i.quantity };
  });
  const fee = deliveryFeeCents();
  const totals = computeTotals(lines, fee);

  // El cliente confirma el total que vio: si los precios cambiaron entre medias, no se cobra otro.
  if (totals.totalCents !== input.expectedTotalCents) {
    return {
      error: "Los precios cambiaron. Revisa tu total antes de confirmar.",
      values,
      quote: toQuote(store.id, products),
      deliveryFeeCents: fee,
    };
  }

  // Solo cuenta pedidos válidos: corregir el carrito no gasta cupo.
  const limit = await consumeRateLimit("order:user", userId);
  if (!limit.ok) {
    return { error: `Hiciste varios pedidos seguidos. Podrás hacer otro en ${retryAfterLabel(limit.retryAfterSec)}.`, values };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, email: true } });
  const customerName = user.name?.trim() || user.email;
  const deliveryAddress = [input.addressLine, input.sector, store.city].join(", ") +
    (input.reference ? ` (Ref: ${input.reference})` : "");
  const storeNotes = sanitizeStoreNotes(input.notes);

  let order: { id: string; publicCode: string } | null = null;
  for (let attempt = 0; attempt < 3 && !order; attempt++) {
    const publicCode = generatePublicCode();
    try {
      order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            publicCode,
            userId,
            storeId: store.id,
            status: "PENDING",
            ...totals,
            notes: input.notes,
            paymentMethod: input.paymentMethod,
            customerName,
            customerPhone: input.phone,
            deliveryAddress,
            items: { create: lines },
            events: { create: { from: null, to: "PENDING", actor: "CUSTOMER" } },
          },
          select: { id: true, publicCode: true },
        });

        await tx.user.update({ where: { id: userId }, data: { phone: input.phone } });
        await saveDefaultAddress(tx, userId, input.addressLine, input.sector, store.city, input.reference);

        const items = lines.map((l) => ({ name: l.nameSnapshot, quantity: l.quantity }));
        await enqueue(
          tx,
          created.id,
          "ADMIN_NEW_ORDER",
          adminPhone(),
          adminNewOrderMessage({
            publicCode,
            storeName: store.name,
            items,
            storeNotes: input.notes,
            customerName,
            customerPhone: input.phone,
            deliveryAddress,
            paymentMethod: input.paymentMethod,
            totalLabel: formatUsd(totals.totalCents),
          }),
        );
        await enqueue(
          tx,
          created.id,
          "STORE_REQUEST",
          store.whatsappPhone,
          storeRequestMessage(
            { publicCode, storeName: store.name, items, storeNotes },
            { accept: buildActionPayload(created.id, "accept"), reject: buildActionPayload(created.id, "reject") },
          ),
        );
        return created;
      });
    } catch (error) {
      // Choque del código corto (muy improbable): se reintenta con otro.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  if (!order) return { error: "No pudimos registrar tu pedido. Inténtalo de nuevo.", values };

  const orderId = order.id;
  after(() => dispatchOutbox({ orderId }));
  redirect(`/pedidos/${order.publicCode}?nuevo=1`);
}

async function saveDefaultAddress(
  tx: Prisma.TransactionClient,
  userId: string,
  line: string,
  sector: string,
  city: string,
  reference: string | null,
) {
  const current = await tx.address.findFirst({ where: { userId, isDefault: true }, select: { id: true } });
  const data = { line, sector, city, reference };
  if (current) await tx.address.update({ where: { id: current.id }, data });
  else await tx.address.create({ data: { ...data, userId, label: "Casa", isDefault: true } });
}
