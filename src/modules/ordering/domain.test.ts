import { describe, expect, it } from "vitest";
import { canTransition, computeTotals, generatePublicCode } from "./domain";

describe("máquina de estados del pedido", () => {
  it("permite el flujo feliz", () => {
    expect(canTransition("PENDING", "SENT_TO_STORE")).toBe(true);
    expect(canTransition("SENT_TO_STORE", "ACCEPTED")).toBe(true);
    expect(canTransition("SENT_TO_STORE", "REJECTED")).toBe(true);
  });

  it("no permite responder dos veces ni saltarse el envío al comercio", () => {
    expect(canTransition("ACCEPTED", "REJECTED")).toBe(false);
    expect(canTransition("REJECTED", "ACCEPTED")).toBe(false);
    expect(canTransition("PENDING", "ACCEPTED")).toBe(false);
  });
});

describe("computeTotals", () => {
  it("suma en centavos sin errores de coma flotante", () => {
    const totals = computeTotals(
      [
        { unitPriceCents: 10, quantity: 3 },
        { unitPriceCents: 20, quantity: 1 },
      ],
      150,
    );
    expect(totals).toEqual({ subtotalCents: 50, deliveryFeeCents: 150, totalCents: 200 });
  });
});

describe("generatePublicCode", () => {
  it("genera códigos legibles sin caracteres ambiguos", () => {
    for (let i = 0; i < 200; i++) {
      expect(generatePublicCode()).toMatch(/^[2-9A-HJKMNP-Z]{5}$/);
    }
  });
});
