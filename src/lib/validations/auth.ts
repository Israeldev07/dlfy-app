import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ingresa un email válido").trim().toLowerCase(),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

/**
 * Celular de Ecuador: se acepta "0991234567", "991234567" o "+593991234567".
 * Se normaliza a E.164 (+5939XXXXXXXX), que es el formato que exige WhatsApp.
 */
export const ecuadorMobileSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, "").replace(/^\+?593/, "").replace(/^0/, ""))
  .pipe(z.string().regex(/^9\d{8}$/, "Ingresa un celular válido (ej. 099 123 4567)"))
  .transform((v) => `+593${v}`);

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Ingresa tu nombre").max(80),
  phone: ecuadorMobileSchema,
  whatsappOptIn: z.literal("on", { error: "Necesitamos tu permiso para avisarte por WhatsApp" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre").max(80),
  phone: ecuadorMobileSchema,
});
