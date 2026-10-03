import { z } from "zod";
import { parsePriceToCents } from "@/modules/admin/domain";
import { ecuadorMobileSchema } from "./auth";

const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`).optional().transform((v) => v || null);

const checkbox = z
  .literal("on")
  .optional()
  .transform((v) => v === "on");

export const storeSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del comercio").max(80),
  description: optionalText(200),
  category: z.enum(["RESTAURANT", "MARKET", "PHARMACY", "LIQUOR", "PETS"], { error: "Elige una categoría" }),
  sector: z.string().trim().min(2, "Indica el barrio o sector").max(60),
  etaMinutes: z.coerce
    .number({ error: "Escribe los minutos" })
    .int("Solo minutos enteros")
    .min(5, "Mínimo 5 minutos")
    .max(180, "Máximo 180 minutos"),
  whatsappPhone: ecuadorMobileSchema,
  isActive: checkbox,
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre del producto").max(80),
  description: optionalText(200),
  price: z
    .string()
    .transform((raw, ctx) => {
      const cents = parsePriceToCents(raw);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: "Precio inválido (ej. 2.50)" });
        return z.NEVER;
      }
      return cents;
    })
    .pipe(z.number().int().min(5, "Mínimo $0,05").max(100_000, "Máximo $1.000")),
  isAvailable: checkbox,
});

const ORDER_STATUSES = ["PENDING", "SENT_TO_STORE", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"] as const;

/** Filtros de la lista de pedidos (vienen de la URL; lo inválido se ignora). */
export const orderFiltersSchema = z.object({
  estado: z.enum([...ORDER_STATUSES, "atencion"]).optional().catch(undefined),
  comercio: z.string().max(40).optional().catch(undefined),
  q: z.string().trim().max(60).optional().catch(undefined).transform((v) => v || undefined),
  pagina: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});

export const idSchema = z.string().min(1).max(40);

export type StoreInput = z.infer<typeof storeSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type OrderFilters = z.infer<typeof orderFiltersSchema>;
