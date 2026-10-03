/**
 * Mensajes de WhatsApp de Dfly. Cada mensaje es una plantilla aprobada por Meta
 * (Business-initiated) con parámetros de cuerpo y, opcionalmente, botones quick reply.
 *
 * PRIVACIDAD: el mensaje al comercio se construye SOLO desde `StoreOrderView`,
 * un tipo que no tiene nombre, teléfono ni dirección del cliente.
 */

export type LineView = { name: string; quantity: number };

/** Lo único que ve el comercio. No añadir campos del cliente aquí. */
export type StoreOrderView = {
  publicCode: string;
  storeName: string;
  items: LineView[];
  storeNotes: string | null;
};

/** Vista completa, solo para el dueño de Dfly. */
export type AdminOrderView = StoreOrderView & {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  paymentMethod: "CASH" | "TRANSFER";
  totalLabel: string;
};

export type OutgoingMessage = {
  template: string;
  language: string;
  bodyParams: string[];
  /** Payloads de los botones quick reply, en el orden definido en la plantilla. */
  quickReplies?: string[];
  /** Texto legible para logs, panel admin y el transporte de desarrollo. */
  preview: string;
};

export const TEMPLATES = {
  adminNewOrder: "nuevo_pedido_admin",
  storeRequest: "pedido_restaurante",
  adminResult: "resultado_pedido_admin",
  customerAccepted: "pedido_confirmado_cliente",
  customerRejected: "pedido_rechazado_cliente",
  adminExpired: "pedido_sin_respuesta_admin",
  customerCancelled: "pedido_cancelado_cliente",
  storeCancelled: "pedido_cancelado_comercio",
} as const;

const LANG = "es";

/** Meta no admite saltos de línea, tabulaciones ni más de 4 espacios seguidos en parámetros. */
export function toParam(value: string) {
  return value.replace(/[\r\n\t]+/g, " / ").replace(/ {2,}/g, " ").trim().slice(0, 1000) || "-";
}

/** Quita teléfonos, correos y enlaces que el cliente pueda escribir en las indicaciones. */
export function sanitizeStoreNotes(notes: string | null | undefined) {
  if (!notes) return null;
  const cleaned = notes
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[dato oculto]")
    .replace(/(?:https?:\/\/|www\.)\S+/gi, "[dato oculto]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[dato oculto]")
    .trim();
  return cleaned || null;
}

function itemsLine(items: LineView[]) {
  return items.map((i) => `${i.quantity} x ${i.name}`).join(", ");
}

const PAYMENT_LABEL = { CASH: "Efectivo", TRANSFER: "Transferencia" } as const;

export function adminNewOrderMessage(o: AdminOrderView): OutgoingMessage {
  const params = [
    o.publicCode,
    o.storeName,
    itemsLine(o.items),
    o.totalLabel,
    PAYMENT_LABEL[o.paymentMethod],
    o.customerName,
    o.customerPhone,
    o.deliveryAddress,
    o.storeNotes ?? "Sin indicaciones",
  ].map(toParam);
  return {
    template: TEMPLATES.adminNewOrder,
    language: LANG,
    bodyParams: params,
    preview: `Nuevo pedido #${params[0]} para ${params[1]}: ${params[2]}. Total ${params[3]} (${params[4]}). Cliente: ${params[5]}, ${params[6]}. Dirección: ${params[7]}. Indicaciones: ${params[8]}.`,
  };
}

export function storeRequestMessage(
  o: StoreOrderView,
  payloads: { accept: string; reject: string },
): OutgoingMessage {
  const params = [o.publicCode, itemsLine(o.items), o.storeNotes ?? "Sin indicaciones"].map(toParam);
  return {
    template: TEMPLATES.storeRequest,
    language: LANG,
    bodyParams: params,
    quickReplies: [payloads.accept, payloads.reject],
    preview: `Pedido #${params[0]} de Dfly: ${params[1]}. Indicaciones: ${params[2]}. [Aceptar] [Rechazar]`,
  };
}

export function adminResultMessage(publicCode: string, storeName: string, accepted: boolean): OutgoingMessage {
  const params = [publicCode, storeName, accepted ? "ACEPTADO" : "RECHAZADO"].map(toParam);
  return {
    template: TEMPLATES.adminResult,
    language: LANG,
    bodyParams: params,
    preview: `Pedido #${params[0]}: ${params[1]} lo ${accepted ? "aceptó" : "rechazó"}.`,
  };
}

export function customerResultMessage(
  publicCode: string,
  customerFirstName: string,
  storeName: string,
  accepted: boolean,
): OutgoingMessage {
  const params = [customerFirstName, publicCode, storeName].map(toParam);
  return {
    template: accepted ? TEMPLATES.customerAccepted : TEMPLATES.customerRejected,
    language: LANG,
    bodyParams: params,
    preview: accepted
      ? `Hola ${params[0]}, tu pedido #${params[1]} en ${params[2]} fue confirmado. ¡Ya lo están preparando!`
      : `Hola ${params[0]}, ${params[2]} no pudo tomar tu pedido #${params[1]}. No se te cobrará nada.`,
  };
}

export function adminExpiredMessage(publicCode: string, storeName: string, minutes: number): OutgoingMessage {
  const params = [publicCode, storeName, String(minutes)].map(toParam);
  return {
    template: TEMPLATES.adminExpired,
    language: LANG,
    bodyParams: params,
    preview: `Pedido #${params[0]}: ${params[1]} no respondió en ${params[2]} min. Llama al comercio.`,
  };
}

export function customerCancelledMessage(publicCode: string, customerFirstName: string, storeName: string): OutgoingMessage {
  const params = [customerFirstName, publicCode, storeName].map(toParam);
  return {
    template: TEMPLATES.customerCancelled,
    language: LANG,
    bodyParams: params,
    preview: `Hola ${params[0]}, tu pedido #${params[1]} en ${params[2]} fue cancelado. No se te cobrará nada.`,
  };
}

/** Aviso al comercio: solo código y nombre del comercio, nunca datos del cliente. */
export function storeCancelledMessage(o: Pick<StoreOrderView, "publicCode" | "storeName">): OutgoingMessage {
  const params = [o.publicCode, o.storeName].map(toParam);
  return {
    template: TEMPLATES.storeCancelled,
    language: LANG,
    bodyParams: params,
    preview: `Pedido #${params[0]} de Dfly para ${params[1]} fue CANCELADO. No lo prepares.`,
  };
}
