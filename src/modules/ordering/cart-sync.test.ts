import { describe, expect, it } from "vitest";
import type { QuotedProduct } from "./cart-sync";
import { reconcileCart, type CartLine } from "./cart-sync";

const line = (productId: string, name: string, priceCents: number, quantity: number, optionIds: string[] = []): CartLine => ({
  key: optionIds.length ? `${productId}:${optionIds.join(",")}` : productId,
  productId,
  name,
  optionIds,
  optionsSummary: null,
  priceCents,
  quantity,
});

const plain = (id: string, name: string, priceCents: number): QuotedProduct => ({ id, name, priceCents, optionGroups: [] });

const lines: CartLine[] = [line("p1", "Hornado", 300, 2), line("p2", "Fritada", 450, 1), line("p3", "Colada", 150, 1)];

const tilapia: QuotedProduct = {
  id: "t",
  name: "Tilapia",
  priceCents: 400,
  optionGroups: [
    {
      id: "g1",
      name: "Acompañante",
      minSelect: 1,
      maxSelect: 1,
      options: [
        { id: "yuca", name: "Yuca", priceDeltaCents: 0 },
        { id: "papas", name: "Papas", priceDeltaCents: 0 },
      ],
    },
    { id: "g2", name: "Agrega", minSelect: 0, maxSelect: 2, options: [{ id: "arroz", name: "Arroz", priceDeltaCents: 50 }] },
  ],
};

describe("reconcileCart", () => {
  it("sin cambios devuelve las mismas líneas y ningún aviso", () => {
    const result = reconcileCart(lines, [plain("p1", "Hornado", 300), plain("p2", "Fritada", 450), plain("p3", "Colada", 150)]);
    expect(result.lines).toEqual(lines);
    expect(result.changes).toEqual([]);
  });

  it("actualiza precios, quita lo no disponible y conserva las cantidades", () => {
    const result = reconcileCart(lines, [plain("p1", "Hornado", 350), plain("p3", "Colada morada", 150)]);
    expect(result.lines).toEqual([line("p1", "Hornado", 350, 2), line("p3", "Colada morada", 150, 1)]);
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

  it("recalcula el precio con las opciones y actualiza su resumen", () => {
    const result = reconcileCart([line("t", "Tilapia", 400, 1, ["yuca", "arroz"])], [tilapia]);
    expect(result.lines[0]).toMatchObject({ priceCents: 450, optionsSummary: "Acompañante: Yuca · Agrega: Arroz" });
    expect(result.changes).toEqual([{ kind: "price", name: "Tilapia", fromCents: 400, toCents: 450 }]);
  });

  it("quita la línea si sus opciones ya no existen", () => {
    const result = reconcileCart([line("t", "Tilapia", 400, 1, ["patacon"])], [tilapia]);
    expect(result.lines).toEqual([]);
    expect(result.changes).toEqual([{ kind: "removed", name: "Tilapia" }]);
  });
});
