import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus, OutboxKind, OutboxStatus } from "@/generated/prisma/enums";
import type { OrderFilters } from "@/lib/validations/admin";
import { stripEcuadorPrefix } from "@/lib/validations/auth";
import { canTransition } from "@/modules/ordering/domain";

/** Pedidos que piden acción del dueño: vencidos sin cancelar o con mensajes que no salieron. */
export const NEEDS_ATTENTION: Prisma.OrderWhereInput = {
  OR: [{ status: "EXPIRED" }, { messages: { some: { status: "FAILED" } }, status: { not: "CANCELLED" } }],
};

const MIN_PHONE_SEARCH_DIGITS = 3;

/**
 * Dígitos para buscar un celular tal como se guarda (+5939XXXXXXXX), escriba el admin
 * "099 123", "+593 99" o "991". `null` si no hay dígitos suficientes para buscar por teléfono.
 */
export function phoneSearchDigits(query: string) {
  const digits = stripEcuadorPrefix(query.replace(/\D/g, ""));
  return digits.length >= MIN_PHONE_SEARCH_DIGITS ? digits : null;
}

/** Filtros de la lista de pedidos. Con AND, para que la búsqueda no pise el OR de "Requieren atención". */
export function adminOrdersWhere(filters: OrderFilters): Prisma.OrderWhereInput {
  const conditions: Prisma.OrderWhereInput[] = [];
  if (filters.estado === "atencion") conditions.push(NEEDS_ATTENTION);
  else if (filters.estado) conditions.push({ status: filters.estado });
  if (filters.comercio) conditions.push({ storeId: filters.comercio });
  if (filters.q) {
    const phone = phoneSearchDigits(filters.q);
    conditions.push({
      OR: [
        { publicCode: { equals: filters.q.toUpperCase().replace(/^#/, "") } },
        { customerName: { contains: filters.q, mode: "insensitive" } },
        ...(phone ? [{ customerPhone: { contains: phone } }] : []),
      ],
    });
  }
  return conditions.length > 0 ? { AND: conditions } : {};
}

/** Ecuador continental: UTC-5 todo el año (sin horario de verano). */
const ECUADOR_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Inicio y fin (exclusivo) del día de hoy en Otavalo, como instantes UTC. */
export function ecuadorDayRange(now = new Date()) {
  const local = new Date(now.getTime() - ECUADOR_OFFSET_MS);
  const start = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) + ECUADOR_OFFSET_MS,
  );
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

/** "Picantería Doña Rosa" → "picanteria-dona-rosa". */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
}

/** "2.50", "2,50", "$2.5" o "3" → centavos. `null` si no es un precio válido. */
export function parsePriceToCents(raw: string): number | null {
  const clean = raw.trim().replace(/^\$\s*/, "").replace(",", ".");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(clean)) return null;
  const [whole, decimals = ""] = clean.split(".");
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"));
}

export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2);
}

export function canAdminCancel(status: OrderStatus) {
  return canTransition(status, "CANCELLED");
}

/**
 * Solo se reintentan mensajes fallidos. El pedido al comercio solo mientras el pedido
 * siga PENDING: si ya se canceló o venció, reenviarlo le pediría preparar algo que no va.
 */
export function canRetryMessage(kind: OutboxKind, messageStatus: OutboxStatus, orderStatus: OrderStatus) {
  if (messageStatus !== "FAILED") return false;
  if (kind === "STORE_REQUEST") return orderStatus === "PENDING";
  return true;
}
