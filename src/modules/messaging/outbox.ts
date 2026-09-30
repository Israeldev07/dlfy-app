import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { OutboxKind } from "@/generated/prisma/enums";
import { transitionOrder } from "@/modules/ordering/transitions";
import type { OutgoingMessage } from "./messages";
import { getTransport } from "./transport";

const MAX_ATTEMPTS = 5;
/** Tiempo que un envío queda "reservado" para que dos procesos no lo manden a la vez. */
const LEASE_MS = 60_000;

export function adminPhone() {
  const phone = process.env.ADMIN_WHATSAPP_TO;
  if (!phone) throw new Error("ADMIN_WHATSAPP_TO no está configurado");
  return phone;
}

/** Guarda el mensaje dentro de la misma transacción que el cambio del pedido (patrón outbox). */
export function enqueue(
  tx: Prisma.TransactionClient,
  orderId: string,
  kind: OutboxKind,
  to: string,
  message: OutgoingMessage,
) {
  return tx.outboxMessage.create({
    data: { orderId, kind, to, payload: message as unknown as Prisma.InputJsonValue },
    select: { id: true },
  });
}

function backoffMs(attempt: number) {
  return 2 ** (attempt - 1) * 60_000; // 1, 2, 4, 8 min
}

/** Envía los mensajes pendientes. Seguro de ejecutar en paralelo (after() + cron). */
export async function dispatchOutbox({ orderId, limit = 25 }: { orderId?: string; limit?: number } = {}) {
  const now = new Date();
  const due = await prisma.outboxMessage.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: now }, ...(orderId ? { orderId } : {}) },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true, kind: true, orderId: true, to: true, payload: true, attempts: true },
  });

  const transport = getTransport();
  let sent = 0;
  let failed = 0;

  for (const msg of due) {
    // Reserva optimista: si otro proceso ya lo tomó, `attempts` no coincide y se salta.
    const claim = await prisma.outboxMessage.updateMany({
      where: { id: msg.id, status: "PENDING", attempts: msg.attempts },
      data: { attempts: { increment: 1 }, nextAttemptAt: new Date(Date.now() + LEASE_MS) },
    });
    if (claim.count === 0) continue;
    const attempt = msg.attempts + 1;

    try {
      const { id } = await transport.send(msg.to, msg.payload as unknown as OutgoingMessage);
      await prisma.$transaction(async (tx) => {
        await tx.outboxMessage.update({
          where: { id: msg.id },
          data: { status: "SENT", waMessageId: id, lastError: null },
        });
        if (msg.kind === "STORE_REQUEST") {
          await transitionOrder(tx, msg.orderId, "PENDING", "SENT_TO_STORE", "SYSTEM");
        }
      });
      sent++;
    } catch (error) {
      failed++;
      const lastError = error instanceof Error ? error.message.slice(0, 500) : "Error desconocido";
      await prisma.outboxMessage.update({
        where: { id: msg.id },
        data:
          attempt >= MAX_ATTEMPTS
            ? { status: "FAILED", lastError }
            : { lastError, nextAttemptAt: new Date(Date.now() + backoffMs(attempt)) },
      });
      console.error(`[outbox] ${msg.kind} del pedido ${msg.orderId} falló (intento ${attempt}): ${lastError}`);
    }
  }

  return { processed: due.length, sent, failed };
}
