"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { safeCallbackUrl } from "@/lib/safe-callback";
import { loginSchema, profileSchema, registerSchema } from "@/lib/validations/auth";

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

export type ProfileState = { ok?: boolean; fieldErrors?: Partial<Record<string, string>>; values?: Record<string, string> };

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { fieldErrors: { name: "Tu sesión expiró. Vuelve a iniciar sesión." } };

  const raw = { name: String(formData.get("name") ?? ""), phone: String(formData.get("phone") ?? "") };
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues), values: raw };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone },
    select: { id: true },
  });
  return { ok: true, values: raw };
}
