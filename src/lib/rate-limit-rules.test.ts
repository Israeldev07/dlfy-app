import { describe, expect, it } from "vitest";
import { clientIp, retryAfterLabel } from "./rate-limit-rules";

describe("clientIp", () => {
  it("prefiere x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" });
    expect(clientIp(headers)).toBe("203.0.113.7");
  });

  it("usa el primer salto de x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" });
    expect(clientIp(headers)).toBe("198.51.100.1");
  });

  it("agrupa en 'unknown' si no hay cabeceras", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("retryAfterLabel", () => {
  it("redondea hacia arriba a minutos", () => {
    expect(retryAfterLabel(1)).toBe("1 minuto");
    expect(retryAfterLabel(60)).toBe("1 minuto");
    expect(retryAfterLabel(61)).toBe("2 minutos");
    expect(retryAfterLabel(600)).toBe("10 minutos");
  });
});
