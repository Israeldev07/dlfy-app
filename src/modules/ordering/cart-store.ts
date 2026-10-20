"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StoreCategory } from "@/generated/prisma/enums";
import { reconcileCart, type CartChange, type CartLine, type CartQuote } from "./cart-sync";

export type { CartLine } from "./cart-sync";
export type CartStore = { id: string; slug: string; name: string; category: StoreCategory };
export type NewCartLine = Omit<CartLine, "quantity">;

type CartState = {
  store: CartStore | null;
  lines: CartLine[];
  /** Devuelve "conflict" si el producto es de otro comercio (un comercio por pedido). */
  add: (store: CartStore, line: NewCartLine, quantity?: number) => "added" | "conflict";
  setQuantity: (key: string, quantity: number) => void;
  replaceWith: (store: CartStore, line: NewCartLine, quantity?: number) => void;
  /** Aplica precios y disponibilidad actuales del servidor; devuelve qué cambió. */
  syncPrices: (quote: CartQuote) => CartChange[];
  clear: () => void;
};

export const MAX_QTY = 50;

const clampQty = (n: number) => Math.min(Math.max(1, n), MAX_QTY);

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      store: null,
      lines: [],
      add(store, line, quantity = 1) {
        const current = get();
        if (current.store && current.store.id !== store.id && current.lines.length > 0) return "conflict";
        const existing = current.lines.find((l) => l.key === line.key);
        set({
          store,
          lines: existing
            ? current.lines.map((l) => (l.key === line.key ? { ...l, quantity: clampQty(l.quantity + quantity) } : l))
            : [...current.lines, { ...line, quantity: clampQty(quantity) }],
        });
        return "added";
      },
      setQuantity(key, quantity) {
        const lines =
          quantity <= 0
            ? get().lines.filter((l) => l.key !== key)
            : get().lines.map((l) => (l.key === key ? { ...l, quantity: clampQty(quantity) } : l));
        set({ lines, store: lines.length ? get().store : null });
      },
      replaceWith(store, line, quantity = 1) {
        set({ store, lines: [{ ...line, quantity: clampQty(quantity) }] });
      },
      syncPrices(quote) {
        const current = get();
        // La cotización es de otro comercio (el carrito cambió mientras tanto): no se toca.
        if (current.store?.id !== quote.storeId) return [];
        const { lines, changes } = reconcileCart(current.lines, quote.products);
        set({ lines, store: lines.length ? current.store : null });
        return changes;
      },
      clear() {
        set({ store: null, lines: [] });
      },
    }),
    {
      name: "dfly-cart",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ store: s.store, lines: s.lines }),
      // v1 no tenía opciones: cada línea era un producto sin acompañantes.
      migrate: (persisted, version) => {
        const state = persisted as { store: CartStore | null; lines: Partial<CartLine>[] };
        if (version < 2) {
          state.lines = state.lines.map((l) => ({ ...l, key: l.productId, optionIds: [], optionsSummary: null }));
        }
        return state as { store: CartStore | null; lines: CartLine[] };
      },
      // Se rehidrata tras montar (CartHydrator) para no romper la hidratación de React.
      skipHydration: true,
    },
  ),
);

export function cartSummary(lines: CartLine[]) {
  return {
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: lines.reduce((n, l) => n + l.priceCents * l.quantity, 0),
  };
}

/** true cuando el carrito ya se leyó de localStorage. */
export function useCartHydrated() {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
