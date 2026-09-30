import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderActor, OrderStatus } from "@/generated/prisma/enums";
import { canTransition } from "./domain";

type Db = Prisma.TransactionClient;

/**
 * Transición condicional: solo cambia si el pedido sigue en `from`.
 * Si dos respuestas llegan a la vez (o el comercio pulsa dos veces), gana la primera.
 */
export async function transitionOrder(
  db: Db,
  orderId: string,
  from: OrderStatus,
  to: OrderStatus,
  actor: OrderActor,
  data: Prisma.OrderUpdateManyMutationInput = {},
) {
  if (!canTransition(from, to)) throw new Error(`Transición no permitida: ${from} → ${to}`);
  const result = await db.order.updateMany({ where: { id: orderId, status: from }, data: { ...data, status: to } });
  if (result.count === 0) return false;
  await db.orderStatusEvent.create({ data: { orderId, from, to, actor } });
  return true;
}
