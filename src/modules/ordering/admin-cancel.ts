import "server-only";
import { prisma } from "@/lib/db";
import { customerCancelledMessage, storeCancelledMessage } from "@/modules/messaging/messages";
import { enqueue } from "@/modules/messaging/outbox";
import { canTransition } from "./domain";
import { transitionOrder } from "./transitions";

export type AdminCancelResult = "cancelled" | "not-found" | "not-cancellable" | "changed-meanwhile";

/**
 * Cancela un pedido desde el panel y avisa al cliente y, si ya recibió el pedido, al comercio.
 * Si el pedido al comercio aún está en cola, se marca SKIPPED para que no salga.
 */
export async function cancelOrderByAdmin(orderId: string): Promise<AdminCancelResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, publicCode: true, customerName: true, customerPhone: true, store: { select: { name: true, whatsappPhone: true } } },
  });
  if (!order) return "not-found";
  if (!canTransition(order.status, "CANCELLED")) return "not-cancellable";

  return prisma.$transaction(async (tx) => {
    const changed = await transitionOrder(tx, orderId, order.status, "CANCELLED", "ADMIN");
    if (!changed) return "changed-meanwhile";

    await tx.outboxMessage.updateMany({
      where: { orderId, kind: "STORE_REQUEST", status: { in: ["PENDING", "FAILED"] } },
      data: { status: "SKIPPED", lastError: "Pedido cancelado antes de enviarse" },
    });
    const storeWasContacted = await tx.outboxMessage.count({
      where: { orderId, kind: "STORE_REQUEST", status: "SENT" },
    });

    const firstName = order.customerName.split(/\s+/)[0] ?? order.customerName;
    await enqueue(
      tx,
      orderId,
      "CUSTOMER_CANCELLED",
      order.customerPhone,
      customerCancelledMessage(order.publicCode, firstName, order.store.name),
    );
    if (storeWasContacted > 0) {
      await enqueue(
        tx,
        orderId,
        "STORE_CANCELLED",
        order.store.whatsappPhone,
        storeCancelledMessage({ publicCode: order.publicCode, storeName: order.store.name }),
      );
    }
    return "cancelled";
  });
}
