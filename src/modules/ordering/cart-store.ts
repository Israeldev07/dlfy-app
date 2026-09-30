"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { StoreCategory } from "@/generated/prisma/enums";

export type CartStore = { id: string; slug: string; name: string; category: StoreCategory };
export type CartLine = { productId: string; name: string; priceCents: number; quantity: number };

type CartState = {
  store: CartStore | null;
  lines: CartLine[];
  /** Devuelve "conflict" si el producto es de otro comercio (un comercio por pedido). */
  add: (store: CartStore, product: Omit<CartLine, "quantity">) => "added" | "conflict";
  setQuantity: (productId: string, quantity: number) => void;
  replaceWith: (store: CartStore, product: Omit<CartLine, "quantity">) => void;
  clear: () => void;
};

const MAX_QTY = 50;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      store: null,
      lines: [],
      add(store, product) {
        const current = get();
        if (current.store && current.store.id !== store.id && current.lines.length > 0) return "conflict";
        const existing = current.lines.find((l) => l.productId === product.productId);
        set({
          store,
          lines: existing
            ? current.lines.map((l) =>
                l.productId === product.productId ? { ...l, quantity: Math.min(l.quantity + 1, MAX_QTY) } : l,
              )
            : [...current.lines, { ...product, quantity: 1 }],
        });
        return "added";
      },
      setQuantity(productId, quantity) {
        const lines =
          quantity <= 0
            ? get().lines.filter((l) => l.productId !== productId)
            : get().lines.map((l) => (l.productId === productId ? { ...l, quantity: Math.min(quantity, MAX_QTY) } : l));
        set({ lines, store: lines.length ? get().store : null });
      },
      replaceWith(store, product) {
        set({ store, lines: [{ ...product, quantity: 1 }] });
      },
      clear() {
        set({ store: null, lines: [] });
      },
    }),
    {
      name: "dfly-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ store: s.store, lines: s.lines }),
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
