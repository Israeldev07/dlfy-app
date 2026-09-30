import { isAuthorizedCron } from "@/lib/cron-auth";
import { dispatchOutbox } from "@/modules/messaging/outbox";

/** Reintenta los mensajes de WhatsApp pendientes. Programar cada minuto. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new Response("Unauthorized", { status: 401 });
  return Response.json(await dispatchOutbox({ limit: 50 }));
}
