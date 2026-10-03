import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton } from "@/components/google-button";
import { safeCallbackUrl } from "@/lib/safe-callback";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function RegisterPage({ searchParams }: PageProps<"/registro">) {
  const { callbackUrl } = await searchParams;
  const next = safeCallbackUrl(typeof callbackUrl === "string" ? callbackUrl : undefined);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-display text-[34px] leading-none tracking-[-0.03em]">Crea tu cuenta</h1>
        <p className="text-[15px] text-ink-soft">Tarda menos de un minuto. Luego eliges tu comercio y pides.</p>
      </div>
      <div className="flex flex-col gap-5 rounded-surface bg-surface p-5 shadow-lift ring-1 ring-line sm:p-7">
        <GoogleButton callbackUrl={next} />
        <RegisterForm callbackUrl={next} />
      </div>
      <p className="text-center text-[14.5px] text-ink-soft">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={next ? `/login?callbackUrl=${encodeURIComponent(next)}` : "/login"}
          className="font-semibold text-brand underline hover:text-brand-deep"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
