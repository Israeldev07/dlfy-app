"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { formatUsd } from "@/modules/catalog/categories";
import { useCart, useCartHydrated, type CartStore } from "@/modules/ordering/cart-store";

type Product = { id: string; name: string; description: string | null; priceCents: number };

export function ProductList({ store, products }: { store: CartStore; products: Product[] }) {
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);
  const cartStore = useCart((s) => s.store);
  const add = useCart((s) => s.add);
  const setQuantity = useCart((s) => s.setQuantity);
  const replaceWith = useCart((s) => s.replaceWith);
  const [pending, setPending] = useState<Product | null>(null);

  const qtyOf = (id: string) => (cartStore?.id === store.id ? lines.find((l) => l.productId === id)?.quantity ?? 0 : 0);

  function handleAdd(p: Product) {
    const result = add(store, { productId: p.id, name: p.name, priceCents: p.priceCents });
    if (result === "conflict") setPending(p);
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
                replaceWith(store, { productId: pending.id, name: pending.name, priceCents: pending.priceCents });
                setPending(null);
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
          return (
            <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-[16px] font-semibold">{p.name}</p>
                {p.description ? <p className="text-[13.5px] text-ink-soft">{p.description}</p> : null}
                <p className="tabular mt-0.5 text-[15px] font-bold">{formatUsd(p.priceCents)}</p>
              </div>
              {!hydrated ? (
                <span className="h-11 w-[124px] flex-none" aria-hidden />
              ) : qty === 0 ? (
                <button
                  type="button"
                  onClick={() => handleAdd(p)}
                  className="press inline-flex h-11 flex-none items-center gap-1.5 rounded-control bg-route px-4 text-[14px] font-bold text-ink hover:bg-route-deep"
                  aria-label={`Agregar ${p.name}`}
                >
                  <Plus aria-hidden className="size-4" strokeWidth={2.5} />
                  Agregar
                </button>
              ) : (
                <div className="flex h-11 flex-none items-center rounded-control ring-1 ring-ink/20" role="group" aria-label={`Cantidad de ${p.name}`}>
                  <button
                    type="button"
                    onClick={() => setQuantity(p.id, qty - 1)}
                    className="flex size-11 items-center justify-center rounded-l-control transition-colors duration-150 hover:bg-ink/[0.06]"
                    aria-label={qty === 1 ? `Quitar ${p.name}` : `Restar uno de ${p.name}`}
                  >
                    <Minus aria-hidden className="size-4" strokeWidth={2.25} />
                  </button>
                  <span className="tabular w-9 text-center text-[15px] font-bold" aria-live="polite">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(p.id, qty + 1)}
                    disabled={qty >= 50}
                    className="flex size-11 items-center justify-center rounded-r-control transition-colors duration-150 hover:bg-ink/[0.06] disabled:opacity-40"
                    aria-label={`Sumar uno de ${p.name}`}
                  >
                    <Plus aria-hidden className="size-4" strokeWidth={2.25} />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
