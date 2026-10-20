import { describe, expect, it } from "vitest";
import { ecuadorMobileSchema, loginSchema } from "./auth";

describe("loginSchema", () => {
  it("normaliza el email con espacios y mayúsculas", () => {
    expect(loginSchema.parse({ email: "  User@Mail.COM ", password: "12345678" }).email).toBe("user@mail.com");
  });

  it("rechaza un email inválido", () => {
    expect(loginSchema.safeParse({ email: "user@", password: "12345678" }).success).toBe(false);
  });
});

describe("ecuadorMobileSchema", () => {
  it.each(["0991234567", "099 123 4567", "991234567", "+593991234567", "+593 99-123-4567"])(
    "normaliza %s a E.164",
    (input) => {
      expect(ecuadorMobileSchema.parse(input)).toBe("+593991234567");
    },
  );

  it.each(["062123456", "12345", "+51987654321", "09912345678"])("rechaza %s", (input) => {
    expect(ecuadorMobileSchema.safeParse(input).success).toBe(false);
  });
});
