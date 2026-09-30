"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/modules/ordering/cart-store";

/**
 * Refresca la página cada 5 s mientras el pedido espera respuesta (solo con la pestaña visible),
 * y vacía el carrito cuando el pedido se acaba de crear.
 */
export function OrderLive({ waiting, justCreated }: { waiting: boolean; justCreated: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (justCreated) useCart.getState().clear();
  }, [justCreated]);

  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 5000);
    return () => window.clearInterval(id);
  }, [waiting, router]);

  return null;
}
