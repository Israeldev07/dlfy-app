import type { OrderActor, OrderStatus, OutboxKind, OutboxStatus } from "@/generated/prisma/enums";

export type Tone = "wait" | "ok" | "bad" | "muted";

/** Etiquetas del panel (operativas; las del cliente están en ordering/status-copy.ts). */
export const ADMIN_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "Por enviar", tone: "wait" },
  SENT_TO_STORE: { label: "Esperando comercio", tone: "wait" },
  ACCEPTED: { label: "Aceptado", tone: "ok" },
  REJECTED: { label: "Rechazado", tone: "bad" },
  EXPIRED: { label: "Sin respuesta", tone: "bad" },
  CANCELLED: { label: "Cancelado", tone: "muted" },
};

export const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "atencion", label: "Requieren atención" },
  ...(Object.keys(ADMIN_STATUS) as OrderStatus[]).map((s) => ({ value: s, label: ADMIN_STATUS[s].label })),
];

export const MESSAGE_KIND: Record<OutboxKind, string> = {
  ADMIN_NEW_ORDER: "Pedido completo al dueño",
  STORE_REQUEST: "Pedido al comercio",
  ADMIN_RESULT: "Respuesta del comercio al dueño",
  CUSTOMER_RESULT: "Resultado al cliente",
  ADMIN_EXPIRED: "Aviso de vencido al dueño",
  CUSTOMER_CANCELLED: "Cancelación al cliente",
  STORE_CANCELLED: "Cancelación al comercio",
};

export const MESSAGE_STATUS: Record<OutboxStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "En cola", tone: "wait" },
  SENT: { label: "Enviado", tone: "ok" },
  FAILED: { label: "Falló", tone: "bad" },
  SKIPPED: { label: "No enviado", tone: "muted" },
};

export const ACTOR: Record<OrderActor, string> = {
  CUSTOMER: "Cliente",
  STORE: "Comercio",
  ADMIN: "Dfly",
  SYSTEM: "Sistema",
};

export const PAYMENT: Record<"CASH" | "TRANSFER", string> = { CASH: "Efectivo", TRANSFER: "Transferencia" };

// "ok" va en tinta: el cian no llega a contraste AA en texto chico; el punto lleva el color.
export const TONE_TEXT: Record<Tone, string> = {
  wait: "text-store",
  ok: "text-ink",
  bad: "text-brand-deep",
  muted: "text-ink-soft",
};

export const TONE_DOT: Record<Tone, string> = {
  wait: "bg-store",
  ok: "bg-route",
  bad: "bg-brand",
  muted: "bg-ink/30",
};

export const dateTime = new Intl.DateTimeFormat("es-EC", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Guayaquil",
});

export const timeOnly = new Intl.DateTimeFormat("es-EC", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "America/Guayaquil",
});
