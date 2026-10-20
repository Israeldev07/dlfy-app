import { describe, expect, it } from "vitest";
import { groupRule, lineKey, priceSelection, type ProductWithOptions } from "./options";

const tilapia: ProductWithOptions = {
  id: "t",
  name: "Tilapia frita",
  priceCents: 400,
  optionGroups: [
    {
      id: "g1",
      name: "Acompañante",
      minSelect: 1,
      maxSelect: 1,
      options: [
        { id: "patacon", name: "Patacón", priceDeltaCents: 0 },
        { id: "yuca", name: "Yuca", priceDeltaCents: 0 },
      ],
    },
    {
      id: "g2",
      name: "Agrega",
      minSelect: 0,
      maxSelect: 2,
      options: [
        { id: "arroz", name: "Arroz", priceDeltaCents: 50 },
        { id: "ensalada", name: "Ensalada extra", priceDeltaCents: 75 },
      ],
    },
  ],
};

describe("priceSelection", () => {
  it("suma los extras y arma el resumen en el orden del producto", () => {
    const r = priceSelection(tilapia, ["ensalada", "yuca", "arroz"]);
    expect(r).toEqual({
      ok: true,
      unitPriceCents: 525,
      summary: "Acompañante: Yuca · Agrega: Arroz, Ensalada extra",
      optionIds: ["yuca", "arroz", "ensalada"],
    });
  });

  it("exige el mínimo de los grupos obligatorios", () => {
    const r = priceSelection(tilapia, ["arroz"]);
    expect(r.ok).toBe(false);
  });

  it("no deja pasar del máximo", () => {
    expect(priceSelection(tilapia, ["patacon", "yuca"]).ok).toBe(false);
  });

  it("rechaza opciones que no son del producto o repetidas", () => {
    expect(priceSelection(tilapia, ["yuca", "otra"]).ok).toBe(false);
    expect(priceSelection(tilapia, ["yuca", "yuca"]).ok).toBe(false);
  });

  it("un producto sin grupos cuesta su precio base", () => {
    const r = priceSelection({ ...tilapia, optionGroups: [] }, []);
    expect(r).toEqual({ ok: true, unitPriceCents: 400, summary: null, optionIds: [] });
  });
});

describe("lineKey y groupRule", () => {
  it("la clave no depende del orden de las opciones", () => {
    expect(lineKey("t", ["b", "a"])).toBe(lineKey("t", ["a", "b"]));
    expect(lineKey("t", [])).toBe("t");
  });

  it("describe la regla del grupo", () => {
    expect(groupRule({ minSelect: 1, maxSelect: 1 })).toBe("Elige 1");
    expect(groupRule({ minSelect: 0, maxSelect: 3 })).toBe("Opcional, hasta 3");
    expect(groupRule({ minSelect: 0, maxSelect: 1 })).toBe("Opcional, elige 1");
    expect(groupRule({ minSelect: 1, maxSelect: 2 })).toBe("Elige de 1 a 2");
  });
});
