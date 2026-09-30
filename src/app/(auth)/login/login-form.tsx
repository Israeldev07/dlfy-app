"use client";

import { useActionState } from "react";
import { Field, FormError, SubmitButton } from "@/components/forms";
import { loginAction, type FormState } from "@/modules/identity/actions";

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <FormError message={state.error} />
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
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
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <SubmitButton pendingLabel="Entrando…">Iniciar sesión</SubmitButton>
    </form>
  );
}
