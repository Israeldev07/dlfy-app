import { z } from "zod";
import { ecuadorMobileSchema } from "./auth";

const cartItemsSchema = z
  .array(
    z.object({
      productId: z.string().min(1).max(40),
      quantity: z.number().int().min(1, "Cantidad inválida").max(50, "Máximo 50 unidades por producto"),
    }),
  )
  .min(1, "Tu carrito está vacío")
  .max(40, "Demasiados productos en un solo pedido");

export const checkoutSchema = z.object({
  storeId: z.string().min(1).max(40),
  items: z
    .string()
    .transform((raw, ctx) => {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Carrito inválido" });
        return z.NEVER;
      }
    })
    .pipe(cartItemsSchema),
  addressLine: z.string().trim().min(5, "Escribe calle y número").max(160),
  sector: z.string().trim().min(2, "Indica tu barrio o sector").max(60),
  reference: z.string().trim().max(160).optional().transform((v) => v || null),
  phone: ecuadorMobileSchema,
  notes: z.string().trim().max(300, "Máximo 300 caracteres").optional().transform((v) => v || null),
  paymentMethod: z.enum(["CASH", "TRANSFER"], { error: "Elige cómo vas a pagar" }),
  ageConfirmed: z.literal("on").optional(),
  /** Total que vio el cliente. Si no coincide con el de la base de datos, no se crea el pedido. */
  expectedTotalCents: z.coerce
    .number({ error: "Recarga la página para ver tu total actualizado." })
    .int("Recarga la página para ver tu total actualizado.")
    .min(0, "Recarga la página para ver tu total actualizado."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Cotización del carrito: precios actuales de los productos de un comercio. */
export const cartQuoteSchema = z.object({
  storeId: z.string().min(1).max(40),
  productIds: z.array(z.string().min(1).max(40)).min(1).max(40),
});
