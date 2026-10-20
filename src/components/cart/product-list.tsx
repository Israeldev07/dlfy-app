"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, Minus, Plus } from "lucide-react";
import { formatUsd } from "@/modules/catalog/categories";
import { groupRule, lineKey, priceSelection, type OptionGroupView } from "@/modules/catalog/options";
import { MAX_QTY, useCart, useCartHydrated, type CartStore, type NewCartLine } from "@/modules/ordering/cart-store";

type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  optionGroups: OptionGroupView[];
};

type Pending = { line: NewCartLine; quantity: number };

export function ProductList({ store, products }: { store: CartStore; products: Product[] }) {
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);
  const cartStore = useCart((s) => s.store);
  const add = useCart((s) => s.add);
  const setQuantity = useCart((s) => s.setQuantity);
  const replaceWith = useCart((s) => s.replaceWith);
  const [pending, setPending] = useState<Pending | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const inThisStore = cartStore?.id === store.id;
  /** Unidades de un producto en el carrito, sumando todas sus combinaciones de opciones. */
  const qtyOf = (id: string) => (inThisStore ? lines.filter((l) => l.productId === id).reduce((n, l) => n + l.quantity, 0) : 0);

  /** true si se agregó; false si el carrito es de otro comercio y hay que confirmar. */
  function addLine(line: NewCartLine, quantity = 1) {
    if (add(store, line, quantity) === "conflict") {
      setPending({ line, quantity });
      return false;
    }
    return true;
  }

  return (
    <div className="flex flex-col gap-4">
      {pending && cartStore ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-surface bg-surface p-4 ring-2 ring-route sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <p className="text-[15px]">
            Tu carrito tiene productos de <strong>{cartStore.name}</strong>. Cada pedido es de un solo comercio.
          </p>
          <div className="flex flex-none gap-2">
            <button
              type="button"
              onClick={() => setPending(null)}
              className="min-h-11 rounded-control px-4 text-[14px] font-medium ring-1 ring-ink/20 transition-colors duration-150 hover:bg-ink/[0.06]"
            >
              Mantener
            </button>
            <button
              type="button"
              onClick={() => {
                replaceWith(store, pending.line, pending.quantity);
                setPending(null);
                setOpenId(null);
              }}
              className="press min-h-11 rounded-control bg-route px-4 text-[14px] font-bold text-ink hover:bg-route-deep"
            >
              Vaciar y empezar aquí
            </button>
          </div>
        </div>
      ) : null}

      <ul className="divide-y divide-line overflow-hidden rounded-surface bg-surface ring-1 ring-line">
        {products.map((p) => {
          const qty = qtyOf(p.id);
          const hasOptions = p.optionGroups.length > 0;
          const open = openId === p.id;
          return (
            <li key={p.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center gap-4">
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt=""
                    width={72}
                    height={72}
                    sizes="72px"
                    className="size-16 flex-none rounded-xl object-cover ring-1 ring-line sm:size-[72px]"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-semibold">{p.name}</p>
                  {p.description ? <p className="text-[13.5px] text-ink-soft">{p.description}</p> : null}
                  <p className="tabular mt-0.5 text-[15px] font-bold">
                    {hasOptions ? <span className="font-medium text-ink-soft">Desde </span> : null}
                    {formatUsd(p.priceCents)}
                  </p>
                </div>

                {!hydrated ? (
                  <span className="h-11 w-[124px] flex-none" aria-hidden />
                ) : hasOptions ? (
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : p.id)}
                    aria-expanded={open}
                    aria-controls={`opciones-${p.id}`}
                    className={`press inline-flex h-11 flex-none items-center gap-1.5 rounded-control px-4 text-[14px] font-bold text-ink ${
                      open ? "ring-1 ring-ink/20 hover:bg-ink/[0.06]" : "bg-route hover:bg-route-deep"
                    }`}
                  >
                    {qty > 0 && !open ? <span className="tabular">{qty} ·</span> : null}
                    {open ? "Cerrar" : qty > 0 ? "Otro" : "Elegir"}
                    <ChevronDown
                      aria-hidden
                      className={`size-4 transition-transform duration-200 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
                      strokeWidth={2.5}
                    />
                  </button>
                ) : qty === 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      addLine({ key: lineKey(p.id, []), productId: p.id, name: p.name, optionIds: [], optionsSummary: null, priceCents: p.priceCents })
                    }
                    className="press inline-flex h-11 flex-none items-center gap-1.5 rounded-control bg-route px-4 text-[14px] font-bold text-ink hover:bg-route-deep"
                    aria-label={`Agregar ${p.name}`}
                  >
                    <Plus aria-hidden className="size-4" strokeWidth={2.5} />
                    Agregar
                  </button>
                ) : (
                  <Stepper
                    label={p.name}
                    value={qty}
                    onChange={(n) => setQuantity(lineKey(p.id, []), n)}
                  />
                )}
              </div>

              {hasOptions ? (
                <div
                  id={`opciones-${p.id}`}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  {/* El margen negativo deja ver el anillo de las opciones, que se dibuja por fuera de su caja. */}
                  <div className="-mx-1 overflow-hidden px-1" inert={!open}>
                    {open ? (
                      <OptionPicker
                        product={p}
                        onAdd={(line, quantity) => {
                          if (addLine(line, quantity)) setOpenId(null);
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex h-11 flex-none items-center rounded-control ring-1 ring-ink/20" role="group" aria-label={`Cantidad de ${label}`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="flex size-11 items-center justify-center rounded-l-control transition-colors duration-150 hover:bg-ink/[0.06]"
        aria-label={value === 1 ? `Quitar ${label}` : `Restar uno de ${label}`}
      >
        <Minus aria-hidden className="size-4" strokeWidth={2.25} />
      </button>
      <span className="tabular w-9 text-center text-[15px] font-bold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QTY}
        className="flex size-11 items-center justify-center rounded-r-control transition-colors duration-150 hover:bg-ink/[0.06] disabled:opacity-40"
        aria-label={`Sumar uno de ${label}`}
      >
        <Plus aria-hidden className="size-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}

/** Acompañantes y extras de un producto, desplegados dentro de su fila. */
function OptionPicker({ product, onAdd }: { product: Product; onAdd: (line: NewCartLine, quantity: number) => void }) {
  const baseId = useId();
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQty] = useState(1);
  const [showErrors, setShowErrors] = useState(false);

  const optionIds = product.optionGroups.flatMap((g) => selected[g.id] ?? []);
  const priced = priceSelection(product, optionIds);
  const unitCents = product.priceCents + product.optionGroups
    .flatMap((g) => g.options.filter((o) => (selected[g.id] ?? []).includes(o.id)))
    .reduce((sum, o) => sum + o.priceDeltaCents, 0);

  function toggle(group: OptionGroupView, optionId: string) {
    setSelected((prev) => {
      const current = prev[group.id] ?? [];
      if (group.maxSelect === 1) return { ...prev, [group.id]: current[0] === optionId && group.minSelect === 0 ? [] : [optionId] };
      if (current.includes(optionId)) return { ...prev, [group.id]: current.filter((id) => id !== optionId) };
      if (current.length >= group.maxSelect) return prev;
      return { ...prev, [group.id]: [...current, optionId] };
    });
  }

  function submit() {
    if (!priced.ok) {
      setShowErrors(true);
      return;
    }
    onAdd(
      {
        key: lineKey(product.id, priced.optionIds),
        productId: product.id,
        name: product.name,
        optionIds: priced.optionIds,
        optionsSummary: priced.summary,
        priceCents: priced.unitPriceCents,
      },
      quantity,
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-5 border-t border-line pt-4">
      {product.optionGroups.map((g) => {
        const picked = selected[g.id] ?? [];
        const missing = showErrors && picked.length < g.minSelect;
        const single = g.maxSelect === 1;
        const full = !single && picked.length >= g.maxSelect;
        return (
          <fieldset key={g.id} className="flex flex-col gap-2" aria-describedby={`${baseId}-${g.id}-regla`}>
            <legend className="flex w-full items-baseline justify-between gap-3">
              <span className="text-[15px] font-bold">{g.name}</span>
              <span
                id={`${baseId}-${g.id}-regla`}
                className={`text-[13px] font-medium ${missing ? "text-brand-deep" : "text-ink-soft"}`}
              >
                {groupRule(g)}
                {g.minSelect > 0 ? " · obligatorio" : ""}
              </span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {g.options.map((o) => {
                const checked = picked.includes(o.id);
                const disabled = full && !checked;
                return (
                  <label
                    key={o.id}
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-control px-3.5 py-2 ring-1 transition-shadow duration-150 has-checked:ring-2 has-checked:ring-route-deep has-focus-visible:ring-2 has-focus-visible:ring-route-deep ${
                      missing ? "ring-brand/50" : "ring-ink/20 hover:ring-ink/40"
                    } ${disabled ? "cursor-not-allowed opacity-50 hover:ring-ink/20" : ""}`}
                  >
                    <input
                      type={single ? "radio" : "checkbox"}
                      name={`${baseId}-${g.id}`}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(g, o.id)}
                      onClick={() => {
                        // Un radio no se desmarca solo: en grupos opcionales, volver a tocarlo lo quita.
                        if (single && checked && g.minSelect === 0) toggle(g, o.id);
                      }}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={`flex size-5 flex-none items-center justify-center ring-1 transition-colors duration-150 ${
                        single ? "rounded-full" : "rounded-[5px]"
                      } ${checked ? "bg-route-deep ring-route-deep text-white" : "bg-surface ring-ink/30"}`}
                    >
                      {checked ? (
                        single ? <span className="size-2 rounded-full bg-white" /> : <Check className="size-3.5" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 text-[15px]">{o.name}</span>
                    <span className="tabular flex-none text-[14px] font-semibold text-ink-soft">
                      {o.priceDeltaCents > 0 ? `+${formatUsd(o.priceDeltaCents)}` : "Incluido"}
                    </span>
                  </label>
                );
              })}
            </div>
            {missing ? (
              <p className="text-[13.5px] font-medium text-brand-deep">Elige {g.minSelect === 1 ? "una opción" : `${g.minSelect} opciones`} para continuar.</p>
            ) : null}
          </fieldset>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Stepper label={product.name} value={quantity} onChange={(n) => setQty(Math.min(Math.max(1, n), MAX_QTY))} />
        <button
          type="button"
          onClick={submit}
          className="press inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-control bg-route px-5 text-[15px] font-bold text-ink hover:bg-route-deep sm:flex-none"
        >
          Agregar · <span className="tabular">{formatUsd(unitCents * quantity)}</span>
        </button>
      </div>
    </div>
  );
}
