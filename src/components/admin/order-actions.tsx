"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, RotateCw } from "lucide-react";
import { cancelOrderAction, retryMessageAction, type AdminFormState } from "@/modules/admin/actions";

function PendingButton({ children, pendingLabel, className }: { children: React.ReactNode; pendingLabel: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending || undefined} className={className}>
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="size-4 animate-spin motion-reduce:animate-none" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Cancelar en dos pasos, sin modal: el primer clic muestra qué va a pasar y pide confirmación. */
export function CancelOrder({ orderId, storeWillBeNotified }: { orderId: string; storeWillBeNotified: boolean }) {
  const [state, action] = useActionState<AdminFormState, FormData>(cancelOrderAction, {});
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex h-11 items-center justify-center rounded-control px-4 text-[15px] font-semibold text-brand-deep ring-1 ring-brand/40 transition-colors duration-150 hover:bg-brand/[0.06]"
        >
          Cancelar pedido
        </button>
        {state.error ? (
          <p role="alert" className="text-[13.5px] font-medium text-brand-deep">
            {state.error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3 rounded-control bg-brand/[0.06] p-4">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-[14.5px] leading-snug">
        <span className="font-bold">¿Cancelar este pedido?</span> Avisaremos por WhatsApp al cliente
        {storeWillBeNotified ? " y al comercio, para que no lo prepare" : ""}. No se puede deshacer.
      </p>
      <div className="flex flex-wrap gap-2">
        <PendingButton
          pendingLabel="Cancelando…"
          className="press inline-flex h-11 items-center gap-2 rounded-control bg-brand-deep px-4 text-[15px] font-bold text-white hover:bg-brand-deep/90 disabled:cursor-progress disabled:opacity-70"
        >
          Sí, cancelar pedido
        </PendingButton>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="inline-flex h-11 items-center rounded-control px-4 text-[15px] font-semibold text-ink hover:bg-ink/[0.06]"
        >
          No, volver
        </button>
      </div>
    </form>
  );
}

export function RetryMessage({ messageId }: { messageId: string }) {
  const [state, action] = useActionState<AdminFormState, FormData>(retryMessageAction, {});
  return (
    <form action={action} className="flex flex-col items-start gap-1">
      <input type="hidden" name="messageId" value={messageId} />
      <PendingButton
        pendingLabel="Reintentando…"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-control px-2.5 text-[14px] font-semibold text-store ring-1 ring-store/30 transition-colors duration-150 hover:bg-store/[0.06] disabled:cursor-progress disabled:opacity-70"
      >
        <RotateCw aria-hidden className="size-3.5" strokeWidth={2.25} />
        Reintentar
      </PendingButton>
      {state.error ? (
        <p role="alert" className="text-[13px] font-medium text-brand-deep">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
