"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton } from "@/components/forms";
import { registerAction, type FormState } from "@/modules/identity/actions";

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState<FormState, FormData>(registerAction, {});
  const optInError = state.fieldErrors?.whatsappOptIn;
  // Tras un error, la casilla sigue lo que se envió (React reinicia el formulario al terminar la action).
  const optedIn = state.values?.whatsappOptIn === "on";

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <FormError message={state.error} />
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      <Field
        label="Nombre"
        name="name"
        autoComplete="name"
        required
        defaultValue={state.values?.name}
        error={state.fieldErrors?.name}
      />
      <Field
        label="Correo"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Field
        label="Celular (WhatsApp)"
        name="phone"
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        placeholder="099 123 4567"
        required
        defaultValue={state.values?.phone}
        error={state.fieldErrors?.phone}
        hint="Aquí te confirmamos cada pedido. El comercio nunca ve tu número."
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        error={state.fieldErrors?.password}
        hint="Mínimo 8 caracteres."
      />

      <div className="flex flex-col gap-1.5">
        <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug text-ink">
          <input
            type="checkbox"
            name="whatsappOptIn"
            defaultChecked={optedIn}
            key={String(optedIn)}
            required
            aria-invalid={optInError ? true : undefined}
            aria-describedby={optInError ? "optin-error" : undefined}
            className="mt-0.5 size-5 flex-none cursor-pointer accent-route-deep"
          />
          Acepto recibir por WhatsApp la confirmación y el estado de mis pedidos.
        </label>
        {optInError ? (
          <p id="optin-error" className="pl-8 text-[13.5px] font-medium text-brand-deep">
            {optInError}
          </p>
        ) : null}
      </div>

      <SubmitButton pendingLabel="Creando tu cuenta…">Crear cuenta</SubmitButton>
    </form>
  );
}
