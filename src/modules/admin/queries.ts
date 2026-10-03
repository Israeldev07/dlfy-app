import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import type { OrderFilters } from "@/lib/validations/admin";
import { adminOrdersWhere, ecuadorDayRange, NEEDS_ATTENTION } from "./domain";

// Todo este módulo es solo para el panel: las páginas que lo usan llaman antes a `requireAdmin`.

export const ORDERS_PAGE_SIZE = 30;

export async function getTodaySummary(now = new Date()) {
  const { start, end } = ecuadorDayRange(now);
  const today = { createdAt: { gte: start, lt: end } };

  const [byStatus, accepted, attention] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: today, _count: { _all: true } }),
    prisma.order.aggregate({ where: { ...today, status: "ACCEPTED" }, _sum: { totalCents: true } }),
    prisma.order.findMany({
      where: NEEDS_ATTENTION,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: attentionSelect,
    }),
  ]);

  const counts = Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])) as Partial<Record<OrderStatus, number>>;
  const total = byStatus.reduce((sum, r) => sum + r._count._all, 0);
  return {
    total,
    waiting: (counts.PENDING ?? 0) + (counts.SENT_TO_STORE ?? 0),
    accepted: counts.ACCEPTED ?? 0,
    rejected: counts.REJECTED ?? 0,
    expired: counts.EXPIRED ?? 0,
    cancelled: counts.CANCELLED ?? 0,
    acceptedSalesCents: accepted._sum.totalCents ?? 0,
    attention,
  };
}

const attentionSelect = {
  id: true,
  publicCode: true,
  status: true,
  totalCents: true,
  createdAt: true,
  customerName: true,
  store: { select: { name: true } },
  _count: { select: { messages: { where: { status: "FAILED" } } } },
} satisfies Prisma.OrderSelect;

export async function listAdminOrders(filters: OrderFilters) {
  const page = filters.pagina ?? 1;
  const where = adminOrdersWhere(filters);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      select: attentionSelect,
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, total, page, pages: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)) };
}

export function getAdminOrder(publicCode: string) {
  return prisma.order.findUnique({
    where: { publicCode },
    select: {
      id: true,
      publicCode: true,
      status: true,
      subtotalCents: true,
      deliveryFeeCents: true,
      totalCents: true,
      notes: true,
      paymentMethod: true,
      customerName: true,
      customerPhone: true,
      deliveryAddress: true,
      createdAt: true,
      respondedAt: true,
      user: { select: { email: true } },
      store: { select: { id: true, name: true, sector: true } },
      items: { select: { id: true, nameSnapshot: true, unitPriceCents: true, quantity: true } },
      events: { orderBy: { createdAt: "asc" }, select: { id: true, from: true, to: true, actor: true, createdAt: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, kind: true, status: true, attempts: true, lastError: true, payload: true, createdAt: true, updatedAt: true },
      },
    },
  });
}

export function listAdminStores() {
  return prisma.store.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      sector: true,
      etaMinutes: true,
      isActive: true,
      _count: { select: { products: true } },
    },
  });
}

/** Para el filtro de pedidos. */
export function listStoreOptions() {
  return prisma.store.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
}

export function getAdminStore(id: string) {
  return prisma.store.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      category: true,
      sector: true,
      etaMinutes: true,
      whatsappPhone: true,
      isActive: true,
      products: {
        orderBy: [{ isAvailable: "desc" }, { name: "asc" }],
        select: { id: true, name: true, description: true, priceCents: true, isAvailable: true },
      },
    },
  });
}

export function getAdminProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      isAvailable: true,
      store: { select: { id: true, name: true } },
    },
  });
}

export function getAdminStoreName(id: string) {
  return prisma.store.findUnique({ where: { id }, select: { id: true, name: true } });
}
