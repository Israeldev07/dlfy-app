"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { formatUsd } from "@/modules/catalog/categories";
import { cartSummary, useCart, useCartHydrated } from "@/modules/ordering/cart-store";

/** Barra fija inferior con el resumen del carrito. Sale desde abajo cuando hay productos. */
export function CartBar() {
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);
  const store = useCart((s) => s.store);
  const pathname = usePathname();
  const { count, subtotalCents } = cartSummary(lines);

  const hiddenHere = pathname.startsWith("/checkout") || pathname.startsWith("/pedidos");
  const visible = hydrated && count > 0 && !hiddenHere;

  return (
    <div
      data-open={visible}
      inert={!visible}
      className="cart-bar pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8"
    >
      <Link
        href="/checkout"
        className="press pointer-events-auto mx-auto flex h-16 w-full max-w-xl items-center justify-between gap-4 rounded-surface bg-ink px-5 text-paper no-underline shadow-pop hover:bg-[#1c1c1c]"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="relative flex-none">
            <ShoppingBag aria-hidden className="size-6 text-route" strokeWidth={1.75} />
            <span className="tabular absolute -top-1.5 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-paper">
              {count}
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-bold">Ver carrito</span>
            {store ? <span className="block truncate text-[12.5px] text-paper/70">{store.name}</span> : null}
          </span>
        </span>
        <span className="tabular flex-none text-[16px] font-bold">{formatUsd(subtotalCents)}</span>
      </Link>
    </div>
  );
}
