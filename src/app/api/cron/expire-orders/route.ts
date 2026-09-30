import { isAuthorizedCron } from "@/lib/cron-auth";
import { dispatchOutbox } from "@/modules/messaging/outbox";
import { expireStaleOrders } from "@/modules/ordering/store-response";

/** Marca como vencidos los pedidos sin respuesta del comercio y avisa al dueño. Programar cada minuto. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) return new Response("Unauthorized", { status: 401 });
  const result = await expireStaleOrders();
  if (result.expired > 0) await dispatchOutbox({ limit: 50 });
  return Response.json(result);
}
