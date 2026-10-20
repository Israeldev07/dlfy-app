import { after } from "next/server";
import { parseActionPayload } from "@/modules/messaging/action-payload";
import { dispatchOutbox } from "@/modules/messaging/outbox";
import { extractButtonTaps, isValidSignature } from "@/modules/messaging/webhook";
import { applyStoreResponse } from "@/modules/ordering/store-response";

/** Verificación del webhook que hace Meta al configurarlo. */
export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (verifyToken && params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === verifyToken) {
    return new Response(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (appSecret) {
    if (!isValidSignature(raw, request.headers.get("x-hub-signature-256"), appSecret)) {
      return new Response("Invalid signature", { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[webhook] WHATSAPP_APP_SECRET no configurado");
    return new Response("Not configured", { status: 500 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const taps = extractButtonTaps(body, process.env.WHATSAPP_PHONE_NUMBER_ID);
  const touchedOrders = new Set<string>();
  let failed = false;

  for (const tap of taps) {
    const action = parseActionPayload(tap.payload);
    if (!action) {
      console.warn(`[webhook] payload no reconocido de ${tap.from}`);
      continue;
    }
    try {
      const result = await applyStoreResponse(action.orderId, action.action, tap.from, tap.messageId);
      console.info(`[webhook] pedido ${action.orderId}: ${action.action} → ${result}`);
      if (result === "applied") touchedOrders.add(action.orderId);
    } catch (error) {
      // Se siguen procesando las demás; la fallida no quedó registrada y se reintenta.
      console.error(`[webhook] error al aplicar ${action.action} al pedido ${action.orderId}`, error);
      failed = true;
    }
  }

  if (touchedOrders.size > 0) {
    after(async () => {
      for (const orderId of touchedOrders) await dispatchOutbox({ orderId });
    });
  }
  // Meta reintenta ante cualquier código distinto de 200; las ya aplicadas quedan deduplicadas.
  if (failed) return new Response("Retry", { status: 500 });
  return new Response("OK", { status: 200 });
}
