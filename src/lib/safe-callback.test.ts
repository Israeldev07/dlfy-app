import { describe, expect, it } from "vitest";
import { safeCallbackUrl } from "./safe-callback";

describe("safeCallbackUrl", () => {
  it("acepta rutas internas", () => {
    expect(safeCallbackUrl("/comercios?categoria=licores")).toBe("/comercios?categoria=licores");
  });

  it("convierte URLs absolutas del proxy en rutas internas", () => {
    expect(safeCallbackUrl("http://localhost:3000/comercios?categoria=licores")).toBe(
      "/comercios?categoria=licores",
    );
  });

  it("nunca redirige a otro dominio", () => {
    expect(safeCallbackUrl("https://malicioso.com/robar")).toBe("/robar");
    expect(safeCallbackUrl("//malicioso.com")).toBe("/");
  });

  it("descarta las páginas de acceso y valores vacíos", () => {
    expect(safeCallbackUrl("/login")).toBeUndefined();
    expect(safeCallbackUrl("/registro?x=1")).toBeUndefined();
    expect(safeCallbackUrl("")).toBeUndefined();
    expect(safeCallbackUrl(undefined)).toBeUndefined();
  });
});
