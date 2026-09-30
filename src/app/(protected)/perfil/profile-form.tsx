"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Field, SubmitButton } from "@/components/forms";
import { updateProfileAction, type ProfileState } from "@/modules/identity/actions";

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action] = useActionState<ProfileState, FormData>(updateProfileAction, {});
  const v = { name, phone, ...state.values };

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <Field label="Nombre" name="name" autoComplete="name" defaultValue={v.name} required error={state.fieldErrors?.name} />
      <Field
        label="Celular (WhatsApp)"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="099 123 4567"
        defaultValue={v.phone}
        required
        error={state.fieldErrors?.phone}
        hint="Aquí te confirmamos cada pedido."
      />
      {state.ok ? (
        <p role="status" className="flex items-center gap-2 text-[14px] font-medium text-route-deep">
          <CheckCircle2 aria-hidden className="size-4" strokeWidth={2.25} />
          Datos guardados.
        </p>
      ) : null}
      <div className="sm:w-56">
        <SubmitButton pendingLabel="Guardando…">Guardar cambios</SubmitButton>
      </div>
    </form>
  );
}
