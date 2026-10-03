"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/modules/ordering/cart-store";

/**
 * Refresca la página cada 5 s mientras el pedido espera respuesta (solo con la pestaña visible),
 * y vacía el carrito cuando el pedido se acaba de crear. Luego quita `?nuevo=1` de la URL
 * (replace, sin entrada nueva en el historial): al volver o recargar no se vacía un carrito
 * nuevo ni reaparece "¡Pedido enviado!".
 */
export function OrderLive({ waiting, justCreated }: { waiting: boolean; justCreated: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!justCreated) return;
    useCart.getState().clear();
    router.replace(pathname, { scroll: false });
  }, [justCreated, pathname, router]);

  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 5000);
    return () => window.clearInterval(id);
  }, [waiting, router]);

  return null;
}
