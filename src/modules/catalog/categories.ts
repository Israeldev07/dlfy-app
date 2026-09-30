import type { StoreCategory } from "@/generated/prisma/enums";

export const CATEGORIES: { slug: string; label: string; value: StoreCategory }[] = [
  { slug: "restaurantes", label: "Restaurantes", value: "RESTAURANT" },
  { slug: "market", label: "Market", value: "MARKET" },
  { slug: "farmacia", label: "Farmacia", value: "PHARMACY" },
  { slug: "licores", label: "Licores", value: "LIQUOR" },
  { slug: "mascotas", label: "Mascotas", value: "PETS" },
];

export function categoryFromSlug(slug: string | undefined) {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryLabel(value: StoreCategory) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function categorySlug(value: StoreCategory) {
  return CATEGORIES.find((c) => c.value === value)?.slug ?? "";
}

const usd = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

/** Precios guardados en centavos de USD. */
export function formatUsd(cents: number) {
  return usd.format(cents / 100);
}
