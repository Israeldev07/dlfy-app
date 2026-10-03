import { describe, expect, it } from "vitest";
import { reconcileCart, type CartLine } from "./cart-sync";

const lines: CartLine[] = [
  { productId: "p1", name: "Hornado", priceCents: 300, quantity: 2 },
  { productId: "p2", name: "Fritada", priceCents: 450, quantity: 1 },
  { productId: "p3", name: "Colada", priceCents: 150, quantity: 1 },
];

describe("reconcileCart", () => {
  it("sin cambios devuelve las mismas líneas y ningún aviso", () => {
    const result = reconcileCart(lines, [
      { productId: "p1", name: "Hornado", priceCents: 300 },
      { productId: "p2", name: "Fritada", priceCents: 450 },
      { productId: "p3", name: "Colada", priceCents: 150 },
    ]);
    expect(result.lines).toEqual(lines);
    expect(result.changes).toEqual([]);
  });

  it("actualiza precios, quita lo no disponible y conserva las cantidades", () => {
    const result = reconcileCart(lines, [
      { productId: "p1", name: "Hornado", priceCents: 350 },
      { productId: "p3", name: "Colada morada", priceCents: 150 },
    ]);
    expect(result.lines).toEqual([
      { productId: "p1", name: "Hornado", priceCents: 350, quantity: 2 },
      { productId: "p3", name: "Colada morada", priceCents: 150, quantity: 1 },
    ]);
    expect(result.changes).toEqual([
      { kind: "price", name: "Hornado", fromCents: 300, toCents: 350 },
      { kind: "removed", name: "Fritada" },
    ]);
  });

  it("si nada sigue disponible vacía el carrito", () => {
    const result = reconcileCart(lines, []);
    expect(result.lines).toEqual([]);
    expect(result.changes).toHaveLength(3);
  });
});
