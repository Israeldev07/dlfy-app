// Puro (sin "use client" ni "server-only"): lo usan el selector del navegador, el carrito, el checkout y los tests.

export type OptionView = { id: string; name: string; priceDeltaCents: number };
export type OptionGroupView = { id: string; name: string; minSelect: number; maxSelect: number; options: OptionView[] };
/** Producto con sus grupos de opciones, tal como se lee de la base de datos. */
export type ProductWithOptions = { id: string; name: string; priceCents: number; optionGroups: OptionGroupView[] };

export type PricedSelection =
  | { ok: true; unitPriceCents: number; summary: string | null; optionIds: string[] }
  | { ok: false; error: string };

/** "Acompañante: elige 1", "Agrega: opcional, hasta 3"… para mostrar la regla del grupo. */
export function groupRule(g: Pick<OptionGroupView, "minSelect" | "maxSelect">) {
  if (g.minSelect === 0) return g.maxSelect === 1 ? "Opcional, elige 1" : `Opcional, hasta ${g.maxSelect}`;
  if (g.minSelect === g.maxSelect) return `Elige ${g.minSelect}`;
  return `Elige de ${g.minSelect} a ${g.maxSelect}`;
}

/** Identifica una línea del carrito: el mismo producto con otras opciones es otra línea. */
export function lineKey(productId: string, optionIds: string[]) {
  return optionIds.length === 0 ? productId : `${productId}:${[...optionIds].sort().join(",")}`;
}

/**
 * Valida las opciones elegidas contra los grupos del producto (que existan, que respeten
 * mínimos y máximos) y calcula el precio unitario. Lo que decide el cobro es esto, ejecutado
 * en el servidor con datos de la base; en el navegador solo se usa para mostrar.
 */
export function priceSelection(product: ProductWithOptions, optionIds: string[]): PricedSelection {
  const chosen = new Set(optionIds);
  if (chosen.size !== optionIds.length) return { ok: false, error: `Opciones repetidas en ${product.name}.` };

  let unitPriceCents = product.priceCents;
  const parts: string[] = [];
  const known = new Set<string>();

  for (const group of product.optionGroups) {
    const picked = group.options.filter((o) => chosen.has(o.id));
    group.options.forEach((o) => known.add(o.id));
    if (picked.length < group.minSelect) {
      return { ok: false, error: `Elige ${group.name.toLowerCase()} para ${product.name}.` };
    }
    if (picked.length > group.maxSelect) {
      return { ok: false, error: `En ${product.name} puedes elegir hasta ${group.maxSelect} en ${group.name.toLowerCase()}.` };
    }
    if (picked.length > 0) {
      unitPriceCents += picked.reduce((sum, o) => sum + o.priceDeltaCents, 0);
      parts.push(`${group.name}: ${picked.map((o) => o.name).join(", ")}`);
    }
  }

  if (optionIds.some((id) => !known.has(id))) {
    return { ok: false, error: `Las opciones de ${product.name} cambiaron. Vuelve a elegirlas.` };
  }

  // Orden estable: el de los grupos y opciones del producto, no el del clic.
  const ordered = product.optionGroups.flatMap((g) => g.options.filter((o) => chosen.has(o.id)).map((o) => o.id));
  return { ok: true, unitPriceCents, summary: parts.length ? parts.join(" · ") : null, optionIds: ordered };
}
