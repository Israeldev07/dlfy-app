"use client";

import { useFormStatus } from "react-dom";

/** Botón secundario para acciones de un clic (activar/ocultar, disponible/agotado). */
export function ToggleButton({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className="inline-flex min-h-10 items-center rounded-control px-3 text-[14px] font-semibold whitespace-nowrap text-ink ring-1 ring-ink/15 transition-colors duration-150 hover:bg-ink/[0.05] disabled:cursor-progress disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
