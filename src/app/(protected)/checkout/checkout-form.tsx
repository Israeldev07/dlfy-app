"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Banknote, Landmark, ShieldCheck } from "lucide-react";
import { Field, FormError, SubmitButton } from "@/components/forms";
import { formatUsd } from "@/modules/catalog/categories";
import { createOrderAction, quoteCartAction, type CheckoutState } from "@/modules/ordering/actions";
import type { CartChange, CartQuote } from "@/modules/ordering/cart-sync";
import { cartSummary, useCart, useCartHydrated } from "@/modules/ordering/cart-store";

type Props = {
  deliveryFeeCents: number;
  defaults: { phone: string; addressLine: string; sector: string; reference: string };
};

export function CheckoutForm({ deliveryFeeCents, defaults }: Props) {
  const hydrated = useCartHydrated();
  const store = useCart((s) => s.store);
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);
  const [changes, setChanges] = useState<CartChange[]>([]);

  // El carrito guarda el precio de cuando se agregó: se pone al día con la BD antes de mostrar el total.
  function applyQuote(quote: CartQuote) {
    setChanges(useCart.getState().syncPrices(quote));
  }

  const [state, action] = useActionState<CheckoutState, FormData>(async (prev, formData) => {
    const next = await createOrderAction(prev, formData);
    if (next.quote) applyQuote(next.quote);
    return next;
  }, {});
  const fe = state.fieldErrors ?? {};
  const v = { ...defaults, notes: "", paymentMethod: "CASH", ageConfirmed: "", ...state.values };
  const ageConfirmed = v.ageConfirmed === "on";
  const feeCents = state.deliveryFeeCents ?? deliveryFeeCents;

  const storeId = store?.id;
  useEffect(() => {
    if (!hydrated || !storeId) return;
    let cancelled = false;
    const productIds = useCart.getState().lines.map((l) => l.productId);
    quoteCartAction({ storeId, productIds })
      .then(({ quote }) => {
        if (!cancelled && quote) setChanges(useCart.getState().syncPrices(quote));
      })
      // Sin cotización se sigue con el carrito guardado: el servidor revisa el total al enviar.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [hydrated, storeId]);

  if (!hydrated) {
    return <div aria-busy className="h-96 animate-pulse rounded-surface bg-ink/[0.05] motion-reduce:animate-none" />;
  }

  if (!store || lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-surface bg-surface p-6 ring-1 ring-line sm:p-8">
        <CartChangesNotice changes={changes} />
        <p className="text-[17px] font-semibold">Tu carrito está vacío.</p>
        <p className="text-[15px] text-ink-soft">Elige un comercio de Otavalo y agrega lo que necesitas.</p>
        <Link
          href="/comercios"
          className="press mt-1 inline-flex h-12 items-center rounded-control bg-route px-6 text-[15px] font-bold text-ink no-underline hover:bg-route-deep"
        >
          Ver comercios
        </Link>
      </div>
    );
  }

  const { subtotalCents } = cartSummary(lines);
  const items = JSON.stringify(lines.map((l) => ({ productId: l.productId, quantity: l.quantity })));
  const totalCents = subtotalCents + feeCents;

  return (
    <form action={action} noValidate className="grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
      <input type="hidden" name="storeId" value={store.id} />
      <input type="hidden" name="items" value={items} />
      <input type="hidden" name="expectedTotalCents" value={totalCents} />

      <div className="flex flex-col gap-8">
        <FormError message={state.error} />

        <fieldset className="flex flex-col gap-4 rounded-surface bg-surface p-5 ring-1 ring-line sm:p-7">
          <legend className="float-left mb-1 text-[18px] font-bold">¿A dónde lo llevamos?</legend>
          <Field
            label="Calle y número"
            name="addressLine"
            autoComplete="street-address"
            placeholder="Ej. Calle Bolívar 5-12"
            defaultValue={v.addressLine}
            required
            error={fe.addressLine}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Barrio o sector"
              name="sector"
              placeholder="Ej. Centro, San Juan"
              defaultValue={v.sector}
              required
              error={fe.sector}
            />
            <Field
              label="Celular (WhatsApp)"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="099 123 4567"
              defaultValue={v.phone}
              required
              error={fe.phone}
            />
          </div>
          <Field
            label="Referencia (opcional)"
            name="reference"
            placeholder="Casa azul, junto a la panadería"
            defaultValue={v.reference}
            error={fe.reference}
          />
          <p className="flex items-start gap-2 text-[13px] text-ink-soft">
            <ShieldCheck aria-hidden className="mt-px size-4 flex-none text-store" strokeWidth={2} />
            Tu nombre, celular y dirección solo los ve Dfly. El comercio recibe únicamente tu pedido.
          </p>
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-surface bg-surface p-5 ring-1 ring-line sm:p-7">
          <legend className="float-left mb-1 text-[18px] font-bold">¿Cómo vas a pagar?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { value: "CASH", label: "Efectivo", hint: "Al recibir tu pedido", Icon: Banknote },
              { value: "TRANSFER", label: "Transferencia", hint: "Te enviamos los datos por WhatsApp", Icon: Landmark },
            ].map(({ value, label, hint, Icon }) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 rounded-control p-4 ring-1 ring-ink/20 transition-shadow duration-150 hover:ring-ink/40 has-checked:ring-2 has-checked:ring-route-deep"
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={value}
                  defaultChecked={value === v.paymentMethod}
                  className="mt-1 size-4 accent-route-deep"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-[15px] font-semibold">
                    <Icon aria-hidden className="size-[18px] text-store" strokeWidth={1.75} />
                    {label}
                  </span>
                  <span className="text-[13px] text-ink-soft">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          {fe.paymentMethod ? <p className="text-[13.5px] font-medium text-brand-deep">{fe.paymentMethod}</p> : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="notes" className="text-[14px] font-semibold">
              Indicaciones para el comercio (opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={300}
              defaultValue={v.notes}
              placeholder="Ej. Sin cebolla, bien cocido"
              className="w-full resize-y rounded-control bg-surface px-4 py-3 text-[16px] ring-1 ring-ink/20 outline-none placeholder:text-ink-soft focus-visible:ring-2 focus-visible:ring-route-deep"
            />
            <p className="text-[13px] text-ink-soft">No incluyas tu número ni tu dirección: aquí solo va lo que el comercio necesita.</p>
          </div>
        </fieldset>
      </div>

      <aside className="flex flex-col gap-5 rounded-surface bg-surface p-5 shadow-lift ring-1 ring-line sm:p-7 lg:sticky lg:top-24">
        <div>
          <p className="text-[13px] font-medium text-ink-soft">Tu pedido en</p>
          <p className="text-[19px] font-bold tracking-[-0.01em]">{store.name}</p>
        </div>
        <ul className="flex flex-col gap-3">
          {lines.map((l) => (
            <li key={l.productId} className="flex items-start justify-between gap-3 text-[15px]">
              <span className="min-w-0">
                <span className="tabular font-semibold">{l.quantity} ×</span> {l.name}
                <button
                  type="button"
                  onClick={() => setQuantity(l.productId, 0)}
                  className="ml-2 text-[13px] font-medium text-brand underline hover:text-brand-deep"
                >
                  Quitar
                </button>
              </span>
              <span className="tabular flex-none font-semibold">{formatUsd(l.priceCents * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t border-line pt-4 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Productos</dt>
            <dd className="tabular">{formatUsd(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Envío</dt>
            <dd className="tabular">{formatUsd(feeCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-[18px] font-bold">
            <dt>Total</dt>
            <dd className="tabular">{formatUsd(totalCents)}</dd>
          </div>
        </dl>

        <CartChangesNotice changes={changes} />

        {store.category === "LIQUOR" ? (
          <div className="flex flex-col gap-1.5">
            <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-snug">
              <input
                type="checkbox"
                name="ageConfirmed"
                defaultChecked={ageConfirmed}
                key={String(ageConfirmed)}
                aria-invalid={fe.ageConfirmed ? true : undefined}
                className="mt-0.5 size-5 flex-none accent-route-deep"
              />
              Confirmo que soy mayor de 18 años.
            </label>
            {fe.ageConfirmed ? <p className="pl-8 text-[13.5px] font-medium text-brand-deep">{fe.ageConfirmed}</p> : null}
          </div>
        ) : null}

        <SubmitButton pendingLabel="Enviando tu pedido…">Hacer pedido · {formatUsd(totalCents)}</SubmitButton>
        <p className="text-center text-[12.5px] text-ink-soft">
          Te avisaremos por WhatsApp cuando el comercio confirme.
        </p>
      </aside>
    </form>
  );
}

/** Qué cambió al poner el carrito al día con los precios actuales. */
function CartChangesNotice({ changes }: { changes: CartChange[] }) {
  if (changes.length === 0) return null;
  return (
    <div role="status" className="flex flex-col gap-2 self-stretch rounded-control bg-surface p-4 ring-2 ring-route">
      <p className="text-[15px] font-bold">Actualizamos tu carrito</p>
      <ul className="flex flex-col gap-1.5 text-[14px] leading-snug">
        {changes.map((c, i) => (
          <li key={`${c.kind}-${c.name}-${i}`}>
            {c.kind === "price" ? (
              <>
                <span className="font-semibold">{c.name}</span> ahora cuesta{" "}
                <span className="tabular font-semibold">{formatUsd(c.toCents)}</span>{" "}
                <span className="text-ink-soft">
                  (antes <span className="tabular">{formatUsd(c.fromCents)}</span>)
                </span>
              </>
            ) : (
              <>
                <span className="font-semibold">{c.name}</span> ya no está disponible y lo quitamos.
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-ink-soft">Revisa el total antes de hacer tu pedido.</p>
    </div>
  );
}
