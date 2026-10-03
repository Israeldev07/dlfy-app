"use client";

import { useActionState } from "react";
import { CheckboxField, Field, FormError, SubmitButton, TextareaField } from "@/components/forms";
import { saveProductAction, type AdminFormState } from "@/modules/admin/actions";

export type ProductFormValues = { name: string; description: string; price: string; isAvailable: boolean };

const EMPTY: ProductFormValues = { name: "", description: "", price: "", isAvailable: true };

export function ProductForm({ storeId, productId, initial = EMPTY }: { storeId: string; productId?: string; initial?: ProductFormValues }) {
  const [state, action] = useActionState<AdminFormState, FormData>(saveProductAction, {});
  const fe = state.fieldErrors ?? {};
  const v = { ...initial, ...state.values };
  const isAvailable = state.values ? state.values.isAvailable === "on" : initial.isAvailable;

  return (
    <form action={action} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      <FormError message={state.error} />
      <Field label="Nombre" name="name" defaultValue={v.name} required error={fe.name} />
      <div className="sm:w-56">
        <Field
          label="Precio (USD)"
          name="price"
          inputMode="decimal"
          placeholder="2.50"
          defaultValue={v.price}
          required
          error={fe.price}
          hint="Con punto o coma: 2.50 o 2,50"
        />
      </div>
      <TextareaField label="Descripción (opcional)" name="description" maxLength={200} defaultValue={v.description} error={fe.description} />
      <CheckboxField
        label="Disponible"
        name="isAvailable"
        defaultChecked={isAvailable}
        hint="Si se agota, desmárcalo: deja de mostrarse y no se puede pedir."
        key={String(isAvailable)}
      />
      <div className="sm:w-60">
        <SubmitButton pendingLabel="Guardando…">{productId ? "Guardar producto" : "Agregar producto"}</SubmitButton>
      </div>
    </form>
  );
}
