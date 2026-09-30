import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { extractButtonTaps, isValidSignature } from "./webhook";

// Estructura real documentada por Meta para un toque en botón quick reply.
const body = {
  object: "whatsapp_business_account",
  entry: [
    {
      id: "102290129340398",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "15550783881", phone_number_id: "106540352242922" },
            contacts: [{ profile: { name: "Fritadas El Lago" }, wa_id: "593990000002" }],
            messages: [
              {
                context: { from: "15550783881", id: "wamid.ctx" },
                from: "593990000002",
                id: "wamid.TAP1",
                timestamp: "1750091045",
                type: "button",
                button: { payload: "o:abc:a:firma", text: "Aceptar" },
              },
              { from: "593990000002", id: "wamid.TXT", type: "text", text: { body: "hola" } },
            ],
          },
        },
      ],
    },
  ],
};

describe("extractButtonTaps", () => {
  it("lee el payload del botón y descarta mensajes de texto", () => {
    expect(extractButtonTaps(body, "106540352242922")).toEqual([
      { messageId: "wamid.TAP1", from: "593990000002", payload: "o:abc:a:firma" },
    ]);
  });

  it("ignora eventos de otro número de WhatsApp", () => {
    expect(extractButtonTaps(body, "999")).toEqual([]);
  });

  it("tolera cuerpos vacíos o inesperados", () => {
    expect(extractButtonTaps(null, "1")).toEqual([]);
    expect(extractButtonTaps({ entry: [{}] }, "1")).toEqual([]);
  });
});

describe("isValidSignature", () => {
  const raw = JSON.stringify(body);
  const good = `sha256=${createHmac("sha256", "app-secret").update(raw).digest("hex")}`;

  it("acepta la firma correcta", () => {
    expect(isValidSignature(raw, good, "app-secret")).toBe(true);
  });

  it("rechaza firma ausente, de otro secreto o de un cuerpo alterado", () => {
    expect(isValidSignature(raw, null, "app-secret")).toBe(false);
    expect(isValidSignature(raw, good, "otro")).toBe(false);
    expect(isValidSignature(raw.replace("Aceptar", "Rechazar"), good, "app-secret")).toBe(false);
  });
});
