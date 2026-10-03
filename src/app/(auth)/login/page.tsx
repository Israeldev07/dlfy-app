import type { Metadata } from "next";
import Link from "next/link";
import { GoogleButton } from "@/components/google-button";
import { safeCallbackUrl } from "@/lib/safe-callback";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { callbackUrl } = await searchParams;
  const next = safeCallbackUrl(typeof callbackUrl === "string" ? callbackUrl : undefined);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <h1 className="font-display text-[34px] leading-none tracking-[-0.03em]">Hola de nuevo</h1>
        <p className="text-[15px] text-ink-soft">Entra para ver los comercios de Otavalo y hacer tu pedido.</p>
      </div>
      <div className="flex flex-col gap-5 rounded-surface bg-surface p-5 shadow-lift ring-1 ring-line sm:p-7">
        <GoogleButton callbackUrl={next} />
        <LoginForm callbackUrl={next} />
      </div>
      <p className="text-center text-[14.5px] text-ink-soft">
        ¿Aún no tienes cuenta?{" "}
        <Link
          href={next ? `/registro?callbackUrl=${encodeURIComponent(next)}` : "/registro"}
          className="font-semibold text-brand underline hover:text-brand-deep"
        >
          Crea una gratis
        </Link>
      </p>
    </div>
  );
}
