import { createHmac, timingSafeEqual } from "node:crypto";

export type StoreAction = "accept" | "reject";

function secret() {
  const value = process.env.ORDER_ACTION_SECRET;
  if (!value) throw new Error("ORDER_ACTION_SECRET no está configurado");
  return value;
}

function sign(orderId: string, action: StoreAction) {
  return createHmac("sha256", secret()).update(`order:${orderId}:${action}`).digest("base64url").slice(0, 22);
}

/** Payload del botón de WhatsApp: `o:<orderId>:<a|r>:<firma>`. Cabe holgado en el límite de 256 caracteres. */
export function buildActionPayload(orderId: string, action: StoreAction) {
  return `o:${orderId}:${action === "accept" ? "a" : "r"}:${sign(orderId, action)}`;
}

/** Devuelve la acción solo si la firma es válida; así nadie puede fabricar respuestas. */
export function parseActionPayload(payload: string): { orderId: string; action: StoreAction } | null {
  const match = /^o:([a-z0-9]{10,40}):([ar]):([A-Za-z0-9_-]{22})$/.exec(payload);
  if (!match) return null;
  const [, orderId, code, signature] = match;
  const action: StoreAction = code === "a" ? "accept" : "reject";
  const expected = Buffer.from(sign(orderId, action));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  return { orderId, action };
}
