import { describe, expect, it } from "vitest";
import { ecuadorMobileSchema } from "./auth";

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
