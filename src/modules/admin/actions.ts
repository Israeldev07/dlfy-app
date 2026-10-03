"use server";

import { after } from "next/server";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { idSchema, productSchema, storeSchema, type StoreInput } from "@/lib/validations/admin";
import { assertAdmin } from "@/modules/identity/session";
import { dispatchOutbox } from "@/modules/messaging/outbox";
import { cancelOrderByAdmin } from "@/modules/ordering/admin-cancel";
import { canRetryMessage, slugify } from "./domain";

export type AdminFormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  values?: Record<string, string>;
};

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) out[String(issue.path[0] ?? "form")] ??= issue.message;
  return out;
}

function formValues(formData: FormData) {
  const out: Record<string, string> = {};
  for (const [k, v] of formData) if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
}

// ───────────── Pedidos ─────────────

const CANCEL_ERRORS = {
  "not-found": "Este pedido ya no existe.",
  "not-cancellable": "Este pedido ya no se puede cancelar.",
  "changed-meanwhile": "El pedido cambió de estado mientras tanto. Revisa y vuelve a intentar.",
} as const;

export async function cancelOrderAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await assertAdmin();
  const orderId = idSchema.safeParse(formData.get("orderId"));
  if (!orderId.success) return { error: "Pedido inválido." };

  const result = await cancelOrderByAdmin(orderId.data);
  if (result !== "cancelled") return { error: CANCEL_ERRORS[result] };

  after(() => dispatchOutbox({ orderId: orderId.data }));
  refresh();
  return { ok: true };
}

export async function retryMessageAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await assertAdmin();
  const messageId = idSchema.safeParse(formData.get("messageId"));
  if (!messageId.success) return { error: "Mensaje inválido." };

  const msg = await prisma.outboxMessage.findUnique({
    where: { id: messageId.data },
    select: { kind: true, status: true, orderId: true, order: { select: { status: true } } },
  });
  if (!msg || !canRetryMessage(msg.kind, msg.status, msg.order.status)) {
    return { error: "Este mensaje ya no se puede reintentar." };
  }

  // Condicionado a FAILED: si dos admins pulsan a la vez, solo uno lo reencola.
  const { count } = await prisma.outboxMessage.updateMany({
    where: { id: messageId.data, status: "FAILED" },
    data: { status: "PENDING", attempts: 0, nextAttemptAt: new Date(), lastError: null },
  });
  if (count > 0) after(() => dispatchOutbox({ orderId: msg.orderId }));
  refresh();
  return { ok: true };
}

// ───────────── Comercios ─────────────

export async function saveStoreAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await assertAdmin();
  const values = formValues(formData);
  const parsed = storeSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues), values };

  const storeId = formData.get("storeId");
  if (typeof storeId === "string" && storeId) {
    const id = idSchema.parse(storeId);
    // El slug no cambia al editar: es la URL pública del comercio.
    await prisma.store.update({ where: { id }, data: parsed.data, select: { id: true } });
    refresh();
    return { ok: true, values };
  }

  const created = await createStoreWithUniqueSlug(parsed.data);
  redirect(`/admin/comercios/${created.id}?nuevo=1`);
}

async function createStoreWithUniqueSlug(data: StoreInput) {
  const base = slugify(data.name) || "comercio";
  for (let n = 1; n <= 20; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    try {
      return await prisma.store.create({ data: { ...data, slug }, select: { id: true } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error(`No se encontró un slug libre para "${data.name}"`);
}

export async function toggleStoreActiveAction(formData: FormData) {
  await assertAdmin();
  const id = idSchema.parse(formData.get("storeId"));
  const isActive = formData.get("isActive") === "true";
  await prisma.store.update({ where: { id }, data: { isActive }, select: { id: true } });
  refresh();
}

// ───────────── Productos ─────────────

export async function saveProductAction(_prev: AdminFormState, formData: FormData): Promise<AdminFormState> {
  await assertAdmin();
  const values = formValues(formData);
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues), values };
  const { price, ...rest } = parsed.data;
  const data = { ...rest, priceCents: price };

  const productId = formData.get("productId");
  if (typeof productId === "string" && productId) {
    const id = idSchema.parse(productId);
    const product = await prisma.product.update({ where: { id }, data, select: { storeId: true } });
    redirect(`/admin/comercios/${product.storeId}`);
  }

  const storeId = idSchema.safeParse(formData.get("storeId"));
  if (!storeId.success) return { error: "Comercio inválido.", values };
  const store = await prisma.store.findUnique({ where: { id: storeId.data }, select: { id: true } });
  if (!store) return { error: "Este comercio ya no existe.", values };

  await prisma.product.create({ data: { ...data, storeId: store.id }, select: { id: true } });
  redirect(`/admin/comercios/${store.id}`);
}

export async function toggleProductAvailableAction(formData: FormData) {
  await assertAdmin();
  const id = idSchema.parse(formData.get("productId"));
  const isAvailable = formData.get("isAvailable") === "true";
  await prisma.product.update({ where: { id }, data: { isAvailable }, select: { id: true } });
  refresh();
}
