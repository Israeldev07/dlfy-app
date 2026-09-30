"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { safeCallbackUrl } from "@/lib/safe-callback";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  values?: Record<string, string>;
};

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = loginSchema.safeParse(raw);
  const values = { email: raw.email ?? "" };
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues), values };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: redirectTarget(formData) });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "El correo o la contraseña no coinciden.", values };
    }
    throw error; // redirect de éxito
  }
  return {};
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { name: raw.name ?? "", email: raw.email ?? "", phone: raw.phone ?? "" };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues), values };
  }
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return {
      fieldErrors: { email: "Ya existe una cuenta con este correo. Inicia sesión." },
      values,
    };
  }

  await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: await bcrypt.hash(password, 12),
      whatsappOptInAt: new Date(),
    },
    select: { id: true },
  });

  await signIn("credentials", { email, password, redirectTo: redirectTarget(formData) });
  return {};
}

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/comercios" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

function redirectTarget(formData: FormData) {
  const raw = formData.get("callbackUrl");
  return safeCallbackUrl(typeof raw === "string" ? raw : undefined) ?? "/comercios";
}
