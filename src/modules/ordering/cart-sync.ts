// Puro (sin "use client" ni "server-only"): lo usan el carrito del navegador, la action y los tests.
import { priceSelection, type ProductWithOptions } from "@/modules/catalog/options";

export type CartLine = {
  /** Producto + opciones elegidas (ver `lineKey`): el mismo producto con otras opciones es otra línea. */
  key: string;
  productId: string;
  name: string;
  optionIds: string[];
  optionsSummary: string | null;
  /** Precio unitario con las opciones sumadas. */
  priceCents: number;
  quantity: number;
};

/** Producto disponible con sus opciones, leído de la base de datos. */
export type QuotedProduct = ProductWithOptions;

/** Lo que devuelve el servidor para poner el carrito al día. */
export type CartQuote = { storeId: string; products: QuotedProduct[] };

export type CartChange =
  | { kind: "price"; name: string; fromCents: number; toCents: number }
  | { kind: "removed"; name: string };

/**
 * Pone las líneas del carrito al día con los productos disponibles: recalcula el precio con
 * las opciones elegidas, quita lo que ya no se vende (o cuyas opciones ya no valen) y devuelve
 * qué cambió para avisar al cliente. Un cambio solo de nombre se aplica sin aviso.
 */
export function reconcileCart(lines: CartLine[], products: QuotedProduct[]) {
  const byId = new Map(products.map((p) => [p.id, p]));
  const changes: CartChange[] = [];
  const next: CartLine[] = [];

  for (const line of lines) {
    const current = byId.get(line.productId);
    const priced = current ? priceSelection(current, line.optionIds) : null;
    if (!current || !priced?.ok) {
      changes.push({ kind: "removed", name: line.name });
      continue;
    }
    if (priced.unitPriceCents !== line.priceCents) {
      changes.push({ kind: "price", name: current.name, fromCents: line.priceCents, toCents: priced.unitPriceCents });
    }
    next.push({ ...line, name: current.name, priceCents: priced.unitPriceCents, optionsSummary: priced.summary });
  }

  return { lines: next, changes };
}
