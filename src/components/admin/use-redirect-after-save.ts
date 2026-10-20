"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Navega a `redirectTo` cuando la acción del formulario termina bien (ver `AdminFormState.redirectTo`). */
export function useRedirectAfterSave(redirectTo: string | undefined) {
  const router = useRouter();
  useEffect(() => {
    // `replace`: al volver atrás no debe reaparecer el formulario ya enviado.
    if (redirectTo) router.replace(redirectTo);
  }, [redirectTo, router]);
}
