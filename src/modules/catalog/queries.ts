import "server-only";
import { prisma } from "@/lib/db";
import type { StoreCategory } from "@/generated/prisma/enums";

// Campos públicos de un comercio. `whatsappPhone` NUNCA se selecciona aquí.
const publicStoreSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  category: true,
  city: true,
  sector: true,
  etaMinutes: true,
  imageUrl: true,
} as const;

export async function listStores(category?: StoreCategory) {
  return prisma.store.findMany({
    where: { isActive: true, ...(category ? { category } : {}) },
    select: { ...publicStoreSelect, _count: { select: { products: { where: { isAvailable: true } } } } },
    orderBy: [{ etaMinutes: "asc" }, { name: "asc" }],
  });
}

export async function getStoreWithProducts(slug: string) {
  return prisma.store.findFirst({
    where: { slug, isActive: true },
    select: {
      ...publicStoreSelect,
      products: {
        where: { isAvailable: true },
        select: { id: true, name: true, description: true, priceCents: true, imageUrl: true },
        orderBy: { name: "asc" },
      },
    },
  });
}

export type PublicStore = Awaited<ReturnType<typeof listStores>>[number];
