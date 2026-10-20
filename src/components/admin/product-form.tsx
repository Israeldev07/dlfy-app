"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { CheckboxField, Field, FormError, SubmitButton, TextareaField } from "@/components/forms";
import { saveProductAction, type AdminFormState } from "@/modules/admin/actions";
import { ImageField } from "./image-field";
import { OptionGroupsEditor, type EditableGroup } from "./option-groups-editor";
import { useRedirectAfterSave } from "./use-redirect-after-save";

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  isAvailable: boolean;
  imageUrl: string | null;
  optionGroups: EditableGroup[];
};

const EMPTY: ProductFormValues = { name: "", description: "", price: "", isAvailable: true, imageUrl: null, optionGroups: [] };

export function ProductForm({ storeId, productId, initial = EMPTY }: { storeId: string; productId?: string; initial?: ProductFormValues }) {
  const [state, action] = useActionState<AdminFormState, FormData>(saveProductAction, {});
  const fe = state.fieldErrors ?? {};
  const v = { ...initial, ...state.values };
  const isAvailable = state.values ? state.values.isAvailable === "on" : initial.isAvailable;
  // Tras un error, el editor vuelve con lo que se envió para no perder lo escrito.
  const groups = state.values?.optionGroups ? restoreGroups(state.values.optionGroups) ?? initial.optionGroups : initial.optionGroups;
  useRedirectAfterSave(state.redirectTo);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
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
      <ImageField label="Foto del producto (opcional)" currentUrl={initial.imageUrl} error={fe.image} />
      <OptionGroupsEditor key={state.values?.optionGroups ?? "inicial"} initial={groups} error={fe.optionGroups} />
      <CheckboxField
        label="Disponible"
        name="isAvailable"
        defaultChecked={isAvailable}
        hint="Si se agota, desmárcalo: deja de mostrarse y no se puede pedir."
        key={String(isAvailable)}
      />
      {state.redirectTo ? (
        <p role="status" className="flex items-center gap-2 text-[14px] font-medium text-route-deep">
          <CheckCircle2 aria-hidden className="size-4" strokeWidth={2.25} />
          Producto guardado.
          <Link href={state.redirectTo} replace className="text-ink underline">
            Volver al comercio
          </Link>
        </p>
      ) : null}
      <div className="sm:w-60">
        {/* Ya guardado: bloqueado mientras se navega para no crear el producto dos veces. */}
        <SubmitButton pendingLabel="Guardando…" disabled={Boolean(state.redirectTo)}>
          {productId ? "Guardar producto" : "Agregar producto"}
        </SubmitButton>
      </div>
    </form>
  );
}

function restoreGroups(raw: string): EditableGroup[] | null {
  try {
    const parsed = JSON.parse(raw) as Omit<EditableGroup, "key">[];
    return parsed.map((g, gi) => ({
      ...g,
      key: `r${gi}`,
      options: g.options.map((o, oi) => ({ ...o, key: `r${gi}-${oi}` })),
    }));
  } catch {
    return null;
  }
}
