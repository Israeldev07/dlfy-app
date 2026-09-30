import "server-only";
import { randomUUID } from "node:crypto";
import type { OutgoingMessage } from "./messages";

export interface WhatsAppTransport {
  send(to: string, message: OutgoingMessage): Promise<{ id: string }>;
}

/** WhatsApp Cloud API oficial (Meta). */
class CloudApiTransport implements WhatsAppTransport {
  constructor(
    private token: string,
    private phoneNumberId: string,
    private version: string,
  ) {}

  async send(to: string, message: OutgoingMessage) {
    const components: unknown[] = [
      { type: "body", parameters: message.bodyParams.map((text) => ({ type: "text", text })) },
      ...(message.quickReplies ?? []).map((payload, index) => ({
        type: "button",
        sub_type: "quick_reply",
        index: String(index),
        parameters: [{ type: "payload", payload }],
      })),
    ];

    const res = await fetch(`https://graph.facebook.com/${this.version}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: { name: message.template, language: { code: message.language }, components },
      }),
      signal: AbortSignal.timeout(10_000),
    });

    const data = (await res.json().catch(() => null)) as
      | { messages?: { id: string }[]; error?: { message?: string; code?: number } }
      | null;
    if (!res.ok || !data?.messages?.[0]?.id) {
      throw new Error(`WhatsApp API ${res.status}: ${data?.error?.message ?? "respuesta inesperada"}`);
    }
    return { id: data.messages[0].id };
  }
}

/** Solo desarrollo: no envía nada, registra el mensaje en la consola del servidor. */
class DevLogTransport implements WhatsAppTransport {
  async send(to: string, message: OutgoingMessage) {
    console.info(`[whatsapp:dev] → ${to} (${message.template})\n  ${message.preview}`);
    return { id: `dev-${randomUUID()}` };
  }
}

export function getTransport(): WhatsAppTransport {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (token && phoneNumberId) {
    return new CloudApiTransport(token, phoneNumberId, process.env.WHATSAPP_API_VERSION || "v25.0");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Faltan WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID en producción");
  }
  return new DevLogTransport();
}
