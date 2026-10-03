"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { CheckboxField, Field, FormError, SelectField, SubmitButton, TextareaField } from "@/components/forms";
import { CATEGORIES } from "@/modules/catalog/categories";
import { saveStoreAction, type AdminFormState } from "@/modules/admin/actions";

export type StoreFormValues = {
  name: string;
  description: string;
  category: string;
  sector: string;
  etaMinutes: string;
  whatsappPhone: string;
  isActive: boolean;
};

const EMPTY: StoreFormValues = {
  name: "",
  description: "",
  category: "",
  sector: "",
  etaMinutes: "30",
  whatsappPhone: "",
  isActive: true,
};

export function StoreForm({ storeId, initial = EMPTY }: { storeId?: string; initial?: StoreFormValues }) {
  const [state, action] = useActionState<AdminFormState, FormData>(saveStoreAction, {});
  const fe = state.fieldErrors ?? {};
  const v = { ...initial, ...state.values };
  // Tras un error, el checkbox sigue lo que se envió (ausente = desmarcado).
  const isActive = state.values ? state.values.isActive === "on" : initial.isActive;

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      {storeId ? <input type="hidden" name="storeId" value={storeId} /> : null}
      <FormError message={state.error} />
      <Field label="Nombre" name="name" defaultValue={v.name} required error={fe.name} />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Categoría"
          name="category"
          defaultValue={v.category}
          error={fe.category}
          options={[{ value: "", label: "Elige una categoría" }, ...CATEGORIES.map((c) => ({ value: c.value, label: c.label }))]}
        />
        <Field label="Barrio o sector" name="sector" defaultValue={v.sector} placeholder="Ej. Centro" required error={fe.sector} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="WhatsApp del comercio"
          name="whatsappPhone"
          type="tel"
          inputMode="tel"
          placeholder="099 123 4567"
          defaultValue={v.whatsappPhone}
          required
          error={fe.whatsappPhone}
          hint="Aquí le llegan los pedidos con Aceptar/Rechazar. Nunca se muestra al cliente."
        />
        <Field
          label="Tiempo de entrega (min)"
          name="etaMinutes"
          type="number"
          inputMode="numeric"
          min={5}
          max={180}
          defaultValue={v.etaMinutes}
          required
          error={fe.etaMinutes}
        />
      </div>
      <TextareaField
        label="Descripción (opcional)"
        name="description"
        maxLength={200}
        defaultValue={v.description}
        placeholder="Ej. Fritada y hornado tradicional"
        error={fe.description}
      />
      <CheckboxField
        label="Visible para los clientes"
        name="isActive"
        defaultChecked={isActive}
        hint="Desmárcalo para ocultarlo del catálogo sin borrar sus productos ni pedidos."
        key={String(isActive)}
      />
      {state.ok ? (
        <p role="status" className="flex items-center gap-2 text-[14px] font-medium text-route-deep">
          <CheckCircle2 aria-hidden className="size-4" strokeWidth={2.25} />
          Cambios guardados.
        </p>
      ) : null}
      <div className="sm:w-60">
        <SubmitButton pendingLabel="Guardando…">{storeId ? "Guardar cambios" : "Crear comercio"}</SubmitButton>
      </div>
    </form>
  );
}
