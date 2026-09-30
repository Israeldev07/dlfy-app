import { randomInt } from "node:crypto";
import type { OrderStatus } from "@/generated/prisma/enums";

/** Estados en los que el cliente todavía espera respuesta del comercio. */
export const WAITING_STATUSES: readonly OrderStatus[] = ["PENDING", "SENT_TO_STORE"];

/** Transiciones permitidas de la máquina de estados del pedido. */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["SENT_TO_STORE", "CANCELLED"],
  SENT_TO_STORE: ["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"],
  ACCEPTED: ["CANCELLED"],
  REJECTED: [],
  EXPIRED: ["CANCELLED"],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return TRANSITIONS[from].includes(to);
}

export type PricedLine = { unitPriceCents: number; quantity: number };

export function computeTotals(lines: PricedLine[], deliveryFeeCents: number) {
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  return { subtotalCents, deliveryFeeCents, totalCents: subtotalCents + deliveryFeeCents };
}

// Sin caracteres ambiguos (0/O, 1/I/L) para dictarlo por teléfono sin errores.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generatePublicCode(length = 5) {
  let code = "";
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

/** Costo de envío fijo del MVP (centavos de USD), configurable por entorno. */
export function deliveryFeeCents() {
  const raw = Number(process.env.DELIVERY_FEE_CENTS ?? "150");
  return Number.isInteger(raw) && raw >= 0 ? raw : 150;
}
