import { beforeAll, describe, expect, it } from "vitest";
import { buildActionPayload, parseActionPayload } from "./action-payload";

const ORDER_ID = "cmg1abcde0001xyz2345";

beforeAll(() => {
  process.env.ORDER_ACTION_SECRET = "secreto-de-prueba";
});

describe("payload firmado de los botones", () => {
  it("ida y vuelta para aceptar y rechazar", () => {
    expect(parseActionPayload(buildActionPayload(ORDER_ID, "accept"))).toEqual({ orderId: ORDER_ID, action: "accept" });
    expect(parseActionPayload(buildActionPayload(ORDER_ID, "reject"))).toEqual({ orderId: ORDER_ID, action: "reject" });
  });

  it("rechaza firmas manipuladas", () => {
    const accept = buildActionPayload(ORDER_ID, "accept");
    // Cambiar la acción sin volver a firmar.
    expect(parseActionPayload(accept.replace(":a:", ":r:"))).toBeNull();
    // Cambiar el pedido.
    expect(parseActionPayload(accept.replace(ORDER_ID, "cmg1abcde0001xyz9999"))).toBeNull();
    expect(parseActionPayload("Aceptar")).toBeNull();
  });

  it("una firma de otro secreto no sirve", () => {
    const payload = buildActionPayload(ORDER_ID, "accept");
    process.env.ORDER_ACTION_SECRET = "otro-secreto";
    expect(parseActionPayload(payload)).toBeNull();
    process.env.ORDER_ACTION_SECRET = "secreto-de-prueba";
  });
});
