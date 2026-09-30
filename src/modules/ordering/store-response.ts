import "server-only";
import { prisma } from "@/lib/db";
import type { StoreAction } from "@/modules/messaging/action-payload";
import { adminExpiredMessage, adminResultMessage, customerResultMessage } from "@/modules/messaging/messages";
import { adminPhone, enqueue } from "@/modules/messaging/outbox";
import { transitionOrder } from "./transitions";

const digits = (phone: string) => phone.replace(/\D/g, "");

export type StoreResponseResult = "applied" | "already-answered" | "not-found" | "wrong-sender";

/** Aplica el Aceptar/Rechazar del comercio y encola los avisos al dueño y al cliente. */
export async function applyStoreResponse(orderId: string, action: StoreAction, fromPhone: string): Promise<StoreResponseResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      publicCode: true,
      customerName: true,
      customerPhone: true,
      store: { select: { name: true, whatsappPhone: true } },
    },
  });
  if (!order) return "not-found";
  // Solo el número registrado del comercio puede responder por ese pedido.
  if (digits(order.store.whatsappPhone) !== digits(fromPhone)) return "wrong-sender";

  const accepted = action === "accept";
  return prisma.$transaction(async (tx) => {
    const changed = await transitionOrder(tx, orderId, "SENT_TO_STORE", accepted ? "ACCEPTED" : "REJECTED", "STORE", {
      respondedAt: new Date(),
    });
    if (!changed) return "already-answered";

    const firstName = order.customerName.split(/\s+/)[0] ?? order.customerName;
    await enqueue(tx, orderId, "ADMIN_RESULT", adminPhone(), adminResultMessage(order.publicCode, order.store.name, accepted));
    await enqueue(
      tx,
      orderId,
      "CUSTOMER_RESULT",
      order.customerPhone,
      customerResultMessage(order.publicCode, firstName, order.store.name, accepted),
    );
    return "applied";
  });
}

export function responseTimeoutMinutes() {
  const n = Number(process.env.ORDER_RESPONSE_TIMEOUT_MIN ?? "10");
  return Number.isFinite(n) && n > 0 ? n : 10;
}

/** Marca como EXPIRED los pedidos sin respuesta y avisa al dueño para que llame al comercio. */
export async function expireStaleOrders() {
  const minutes = responseTimeoutMinutes();
  const cutoff = new Date(Date.now() - minutes * 60_000);
  const stale = await prisma.order.findMany({
    where: { status: "SENT_TO_STORE", updatedAt: { lte: cutoff } },
    select: { id: true, publicCode: true, store: { select: { name: true } } },
    take: 50,
  });

  let expired = 0;
  for (const order of stale) {
    const changed = await prisma.$transaction(async (tx) => {
      const ok = await transitionOrder(tx, order.id, "SENT_TO_STORE", "EXPIRED", "SYSTEM");
      if (ok) {
        await enqueue(tx, order.id, "ADMIN_EXPIRED", adminPhone(), adminExpiredMessage(order.publicCode, order.store.name, minutes));
      }
      return ok;
    });
    if (changed) expired++;
  }
  return { expired };
}
