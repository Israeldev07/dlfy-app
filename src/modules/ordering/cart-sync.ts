// Puro (sin "use client" ni "server-only"): lo usan el carrito del navegador, la action y los tests.

export type CartLine = { productId: string; name: string; priceCents: number; quantity: number };

/** Precio y nombre actuales de un producto disponible, leídos de la base de datos. */
export type QuotedProduct = { productId: string; name: string; priceCents: number };

/** Lo que devuelve el servidor para poner el carrito al día. */
export type CartQuote = { storeId: string; products: QuotedProduct[] };

export type CartChange =
  | { kind: "price"; name: string; fromCents: number; toCents: number }
  | { kind: "removed"; name: string };

/**
 * Pone las líneas del carrito al día con los productos disponibles: actualiza precio y nombre,
 * quita lo que ya no se vende y devuelve qué cambió para avisar al cliente.
 * Un cambio solo de nombre se aplica sin aviso: no altera lo que se cobra.
 */
export function reconcileCart(lines: CartLine[], products: QuotedProduct[]) {
  const byId = new Map(products.map((p) => [p.productId, p]));
  const changes: CartChange[] = [];
  const next: CartLine[] = [];

  for (const line of lines) {
    const current = byId.get(line.productId);
    if (!current) {
      changes.push({ kind: "removed", name: line.name });
      continue;
    }
    if (current.priceCents !== line.priceCents) {
      changes.push({ kind: "price", name: current.name, fromCents: line.priceCents, toCents: current.priceCents });
    }
    next.push({ ...line, name: current.name, priceCents: current.priceCents });
  }

  return { lines: next, changes };
}
