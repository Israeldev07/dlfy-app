import { after } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
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

  for (const tap of taps) {
    // Idempotencia: Meta puede reenviar el mismo evento.
    try {
      await prisma.webhookEvent.create({ data: { waMessageId: tap.messageId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }

    const action = parseActionPayload(tap.payload);
    if (!action) {
      console.warn(`[webhook] payload no reconocido de ${tap.from}`);
      continue;
    }
    const result = await applyStoreResponse(action.orderId, action.action, tap.from);
    console.info(`[webhook] pedido ${action.orderId}: ${action.action} → ${result}`);
    if (result === "applied") touchedOrders.add(action.orderId);
  }

  if (touchedOrders.size > 0) {
    after(async () => {
      for (const orderId of touchedOrders) await dispatchOutbox({ orderId });
    });
  }
  // Responder 200 rápido; Meta reintenta ante cualquier otro código.
  return new Response("OK", { status: 200 });
}
