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

// ───────────── Acompañantes y extras ─────────────

const MAX_GROUPS = 10;
const MAX_OPTIONS = 30;

const optionInputSchema = z.object({
  id: z.string().max(40).optional(),
  name: z.string().trim().min(1, "escribe el nombre de la opción").max(60, "el nombre de la opción es muy largo"),
  /** Precio extra que define el admin; vacío = sin costo. */
  price: z.string().max(12).transform((raw, ctx) => {
    if (raw.trim() === "") return 0;
    const cents = parsePriceToCents(raw);
    if (cents === null || cents > 100_000) {
      ctx.addIssue({ code: "custom", message: "precio extra inválido (ej. 0.50)" });
      return z.NEVER;
    }
    return cents;
  }),
});

const groupInputSchema = z
  .object({
    id: z.string().max(40).optional(),
    name: z.string().trim().min(1, "escribe el nombre del grupo").max(60, "el nombre del grupo es muy largo"),
    required: z.boolean(),
    maxSelect: z.number().int().min(1, "deja elegir al menos 1").max(MAX_OPTIONS),
    options: z.array(optionInputSchema).min(1, "agrega al menos una opción").max(MAX_OPTIONS),
  })
  .refine((g) => g.maxSelect <= g.options.length, {
    message: "el máximo a elegir no puede superar el número de opciones",
    path: ["maxSelect"],
  });

/** Grupos de opciones del formulario de producto (vienen como JSON del editor). */
export const optionGroupsSchema = z
  .string()
  .optional()
  .transform((raw, ctx) => {
    try {
      return JSON.parse(raw || "[]") as unknown;
    } catch {
      ctx.addIssue({ code: "custom", message: "No se pudieron leer los acompañantes. Recarga la página." });
      return z.NEVER;
    }
  })
  .pipe(z.array(groupInputSchema).max(MAX_GROUPS, `Máximo ${MAX_GROUPS} grupos por producto`))
  .transform((groups) =>
    groups.map((g) => ({
      id: g.id,
      name: g.name,
      minSelect: g.required ? 1 : 0,
      maxSelect: g.maxSelect,
      options: g.options.map((o) => ({ id: o.id, name: o.name, priceDeltaCents: o.price })),
    })),
  );

export type OptionGroupsInput = z.infer<typeof optionGroupsSchema>;

/** "Grupo 2, opción 1: escribe el nombre de la opción." a partir del error de Zod. */
export function optionGroupsErrorMessage(issue: { path: PropertyKey[]; message: string }) {
  const [group, field, option] = issue.path;
  if (typeof group !== "number") return issue.message;
  const where = field === "options" && typeof option === "number" ? `Grupo ${group + 1}, opción ${option + 1}` : `Grupo ${group + 1}`;
  return `${where}: ${issue.message}.`;
}

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
