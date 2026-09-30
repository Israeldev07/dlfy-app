import "server-only";
import { prisma } from "@/lib/db";

/** Pedido del propio cliente. La propiedad se verifica en la consulta (userId). */
export function getCustomerOrder(publicCode: string, userId: string) {
  return prisma.order.findFirst({
    where: { publicCode, userId },
    select: {
      publicCode: true,
      status: true,
      subtotalCents: true,
      deliveryFeeCents: true,
      totalCents: true,
      paymentMethod: true,
      deliveryAddress: true,
      notes: true,
      createdAt: true,
      respondedAt: true,
      store: { select: { name: true, slug: true } },
      items: { select: { id: true, nameSnapshot: true, unitPriceCents: true, quantity: true } },
    },
  });
}

export function listCustomerOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      publicCode: true,
      status: true,
      totalCents: true,
      createdAt: true,
      store: { select: { name: true } },
      _count: { select: { items: true } },
    },
  });
}
