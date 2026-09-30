import { describe, expect, it } from "vitest";
import {
  adminNewOrderMessage,
  sanitizeStoreNotes,
  storeRequestMessage,
  toParam,
  type AdminOrderView,
} from "./messages";

const order: AdminOrderView = {
  publicCode: "A7K3P",
  storeName: "Fritadas El Lago",
  items: [
    { name: "Fritada completa", quantity: 2 },
    { name: "Jugo de mora", quantity: 1 },
  ],
  storeNotes: "Sin cebolla, por favor",
  customerName: "María Cachimuel",
  customerPhone: "+593991234567",
  deliveryAddress: "Calle Bolívar 5-12, Centro, Otavalo (junto a la panadería)",
  paymentMethod: "CASH",
  totalLabel: "$15,50",
};

describe("privacidad del mensaje al comercio", () => {
  it("NUNCA incluye nombre, teléfono ni dirección del cliente", () => {
    // Aunque por error se le pase la vista completa, el builder solo usa los campos del comercio.
    const msg = storeRequestMessage(order, { accept: "A", reject: "R" });
    const everything = JSON.stringify(msg);
    expect(everything).not.toContain("María");
    expect(everything).not.toContain("Cachimuel");
    expect(everything).not.toContain("991234567");
    expect(everything).not.toContain("Bolívar");
    expect(everything).toContain("2 x Fritada completa");
    expect(msg.quickReplies).toEqual(["A", "R"]);
  });

  it("el dueño sí recibe todos los datos", () => {
    const text = JSON.stringify(adminNewOrderMessage(order));
    expect(text).toContain("María Cachimuel");
    expect(text).toContain("+593991234567");
    expect(text).toContain("Calle Bolívar");
  });
});

describe("sanitizeStoreNotes", () => {
  it("oculta teléfonos, correos y enlaces escritos por el cliente", () => {
    expect(sanitizeStoreNotes("Llamar al 099 123 4567 al llegar")).toBe("Llamar al [dato oculto] al llegar");
    expect(sanitizeStoreNotes("mi correo maria@mail.com")).toBe("mi correo [dato oculto]");
    expect(sanitizeStoreNotes("ver https://wa.me/593991234567")).toBe("ver [dato oculto]");
    expect(sanitizeStoreNotes("Sin ají, 2 servilletas")).toBe("Sin ají, 2 servilletas");
    expect(sanitizeStoreNotes("   ")).toBeNull();
  });
});

describe("toParam", () => {
  it("elimina saltos de línea y espacios repetidos que Meta rechaza", () => {
    expect(toParam("línea 1\nlínea 2\t\tfin     ok")).toBe("línea 1 / línea 2 / fin ok");
    expect(toParam("   ")).toBe("-");
  });
});
