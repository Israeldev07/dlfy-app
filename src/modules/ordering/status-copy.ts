import type { OrderStatus } from "@/generated/prisma/enums";

export const STATUS_COPY: Record<OrderStatus, { label: string; detail: string; tone: "wait" | "ok" | "bad" }> = {
  PENDING: {
    label: "Recibido",
    detail: "Registramos tu pedido y lo estamos enviando al comercio.",
    tone: "wait",
  },
  SENT_TO_STORE: {
    label: "Esperando al comercio",
    detail: "El comercio está revisando tu pedido. Suele responder en pocos minutos.",
    tone: "wait",
  },
  ACCEPTED: {
    label: "Confirmado",
    detail: "El comercio aceptó tu pedido y lo está preparando. Te avisamos por WhatsApp.",
    tone: "ok",
  },
  REJECTED: {
    label: "No disponible",
    detail: "El comercio no pudo tomar tu pedido. No se te cobrará nada.",
    tone: "bad",
  },
  EXPIRED: {
    label: "Sin respuesta",
    detail: "El comercio no respondió a tiempo. Un asesor de Dfly te contactará por WhatsApp.",
    tone: "bad",
  },
  CANCELLED: {
    label: "Cancelado",
    detail: "Este pedido fue cancelado.",
    tone: "bad",
  },
};
