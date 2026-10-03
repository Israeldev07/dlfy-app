import { describe, expect, it } from "vitest";
import {
  adminOrdersWhere,
  canAdminCancel,
  canRetryMessage,
  ecuadorDayRange,
  NEEDS_ATTENTION,
  parsePriceToCents,
  phoneSearchDigits,
  slugify,
} from "./domain";

describe("ecuadorDayRange", () => {
  it("usa el día de Otavalo aunque en UTC ya sea mañana", () => {
    // 2 de oct, 22:30 en Ecuador = 3 de oct, 03:30 UTC.
    const { start, end } = ecuadorDayRange(new Date("2026-10-03T03:30:00Z"));
    expect(start.toISOString()).toBe("2026-10-02T05:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-03T05:00:00.000Z");
  });

  it("a medianoche exacta empieza el día nuevo", () => {
    expect(ecuadorDayRange(new Date("2026-10-03T05:00:00Z")).start.toISOString()).toBe("2026-10-03T05:00:00.000Z");
  });
});

describe("slugify", () => {
  it("quita tildes, eñes y símbolos", () => {
    expect(slugify("Picantería Doña Rosa")).toBe("picanteria-dona-rosa");
    expect(slugify("  Licores & Más #1 ")).toBe("licores-mas-1");
  });
});

describe("parsePriceToCents", () => {
  it("acepta punto, coma, símbolo de dólar y enteros", () => {
    expect(parsePriceToCents("2.50")).toBe(250);
    expect(parsePriceToCents("2,5")).toBe(250);
    expect(parsePriceToCents("$ 3")).toBe(300);
    expect(parsePriceToCents("0.05")).toBe(5);
  });

  it("rechaza valores que no son precio", () => {
    for (const bad of ["", "abc", "-1", "2.555", "1.000,50"]) expect(parsePriceToCents(bad)).toBeNull();
  });
});

describe("reglas del panel", () => {
  it("no se puede cancelar lo que ya terminó mal", () => {
    expect(canAdminCancel("ACCEPTED")).toBe(true);
    expect(canAdminCancel("EXPIRED")).toBe(true);
    expect(canAdminCancel("REJECTED")).toBe(false);
    expect(canAdminCancel("CANCELLED")).toBe(false);
  });

  it("el pedido al comercio solo se reintenta si el pedido sigue pendiente", () => {
    expect(canRetryMessage("STORE_REQUEST", "FAILED", "PENDING")).toBe(true);
    expect(canRetryMessage("STORE_REQUEST", "FAILED", "CANCELLED")).toBe(false);
    expect(canRetryMessage("CUSTOMER_RESULT", "FAILED", "ACCEPTED")).toBe(true);
    expect(canRetryMessage("CUSTOMER_RESULT", "SENT", "ACCEPTED")).toBe(false);
  });
});

describe("phoneSearchDigits", () => {
  it.each([
    ["0991234567", "991234567"],
    ["099 123 4567", "991234567"],
    ["+593 99-123-4567", "991234567"],
    ["593991234567", "991234567"],
    ["0991", "991"],
  ])("normaliza %s para buscar en +5939XXXXXXXX", (query, expected) => {
    const digits = phoneSearchDigits(query);
    expect(digits).toBe(expected);
    expect("+593991234567").toContain(digits);
  });

  it("sin dígitos suficientes no busca por teléfono", () => {
    expect(phoneSearchDigits("099")).toBeNull();
    expect(phoneSearchDigits("María")).toBeNull();
    expect(phoneSearchDigits("AB2CD")).toBeNull();
    expect(phoneSearchDigits("+593")).toBeNull();
  });
});

describe("adminOrdersWhere", () => {
  it("sin filtros no restringe nada", () => {
    expect(adminOrdersWhere({ q: undefined })).toEqual({});
  });

  it("la búsqueda no pisa el filtro de 'Requieren atención'", () => {
    const where = adminOrdersWhere({ estado: "atencion", q: "maria" });
    expect(where.AND).toHaveLength(2);
    expect(where.AND).toContainEqual(NEEDS_ATTENTION);
    expect(where.OR).toBeUndefined();
  });

  it("combina estado, comercio y búsqueda, y solo busca por celular si hay dígitos", () => {
    const where = adminOrdersWhere({ estado: "ACCEPTED", comercio: "store1", q: "099 123" });
    expect(where.AND).toEqual([
      { status: "ACCEPTED" },
      { storeId: "store1" },
      {
        OR: [
          { publicCode: { equals: "099 123" } },
          { customerName: { contains: "099 123", mode: "insensitive" } },
          { customerPhone: { contains: "99123" } },
        ],
      },
    ]);
    const byName = adminOrdersWhere({ q: "Rosa" }).AND as { OR: unknown[] }[];
    expect(byName[0].OR).toHaveLength(2);
  });
});
