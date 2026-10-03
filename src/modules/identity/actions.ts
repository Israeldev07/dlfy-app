"use server";

import bcrypt from "bcryptjs";
import { AuthError, CredentialsSignin } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { consumeRateLimit, peekRateLimit } from "@/lib/rate-limit";
import { clientIp, RATE_LIMITED_CODE, retryAfterLabel } from "@/lib/rate-limit-rules";
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
    if (error instanceof CredentialsSignin && error.code === RATE_LIMITED_CODE) {
      const wait = await loginRetryAfterSec(parsed.data.email);
      return { error: `Demasiados intentos. Vuelve a intentarlo en ${retryAfterLabel(wait)}.`, values };
    }
    if (error instanceof AuthError) {
      return { error: "El correo o la contraseña no coinciden.", values };
    }
    throw error; // redirect de éxito
  }
  return {};
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const values = { name: raw.name ?? "", email: raw.email ?? "", phone: raw.phone ?? "", whatsappOptIn: raw.whatsappOptIn ?? "" };
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues), values };
  }
  const { name, email, phone, password } = parsed.data;

  // Antes de consultar el email, para que tampoco sirva para enumerar cuentas.
  const limit = await consumeRateLimit("register:ip", clientIp(await headers()));
  if (!limit.ok) {
    return { error: `Demasiados registros desde esta conexión. Inténtalo en ${retryAfterLabel(limit.retryAfterSec)}.`, values };
  }

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

  try {
    await signIn("credentials", { email, password, redirectTo: redirectTarget(formData) });
  } catch (error) {
    // La cuenta ya existe; si el login automático falla (p. ej. rate limit), que entre a mano.
    if (error instanceof AuthError) redirect("/login");
    throw error; // redirect de éxito
  }
  return {};
}

export async function googleSignInAction(formData: FormData) {
  await signIn("google", { redirectTo: redirectTarget(formData) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/** La espera que ve el usuario es la del bloqueo más largo (por IP o por email). */
async function loginRetryAfterSec(email: string) {
  const ip = clientIp(await headers());
  const checks = await Promise.all([peekRateLimit("login:ip", ip), peekRateLimit("login:email", email)]);
  return Math.max(...checks.map((c) => (c.ok ? 0 : c.retryAfterSec)), 60);
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
