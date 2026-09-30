import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleX, LoaderCircle, MessageCircle } from "lucide-react";
import { formatUsd } from "@/modules/catalog/categories";
import { requireUser } from "@/modules/identity/session";
import { WAITING_STATUSES } from "@/modules/ordering/domain";
import { getCustomerOrder } from "@/modules/ordering/queries";
import { STATUS_COPY } from "@/modules/ordering/status-copy";
import { OrderLive } from "./order-live";

export async function generateMetadata({ params }: PageProps<"/pedidos/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: `Pedido #${code}` };
}

const STEPS = ["Recibido", "Enviado al comercio", "Confirmado"] as const;

export default async function OrderPage({ params, searchParams }: PageProps<"/pedidos/[code]">) {
  const { code } = await params;
  const { nuevo } = await searchParams;
  const user = await requireUser(`/pedidos/${code}`);
  const order = await getCustomerOrder(code.toUpperCase(), user.id);
  if (!order) notFound();

  const copy = STATUS_COPY[order.status];
  const waiting = WAITING_STATUSES.includes(order.status);
  const reached = order.status === "PENDING" ? 0 : order.status === "SENT_TO_STORE" ? 1 : order.status === "ACCEPTED" ? 2 : 1;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pt-8 pb-20 sm:px-8 sm:pt-12">
      <OrderLive waiting={waiting} justCreated={nuevo === "1"} />

      <div className="flex flex-col gap-2">
        <p className="text-[14px] font-medium text-ink-soft">
          Pedido <span className="tabular font-bold text-ink">#{order.publicCode}</span> · {order.store.name}
        </p>
        <h1 className="font-display text-[32px] leading-none tracking-[-0.03em] text-balance sm:text-[40px]">
          {nuevo === "1" && waiting ? "¡Pedido enviado!" : copy.label}
        </h1>
      </div>

      <section
        aria-live="polite"
        className={`flex flex-col gap-5 rounded-surface p-5 ring-1 sm:p-7 ${
          copy.tone === "ok" ? "bg-route/10 ring-route/40" : copy.tone === "bad" ? "bg-brand/[0.06] ring-brand/30" : "bg-surface ring-line"
        }`}
      >
        <div className="flex items-start gap-3">
          {copy.tone === "ok" ? (
            <CheckCircle2 aria-hidden className="size-7 flex-none text-route-deep" strokeWidth={2} />
          ) : copy.tone === "bad" ? (
            <CircleX aria-hidden className="size-7 flex-none text-brand-deep" strokeWidth={2} />
          ) : (
            <LoaderCircle aria-hidden className="size-7 flex-none animate-spin text-store motion-reduce:animate-none" strokeWidth={2} />
          )}
          <div>
            <p className="text-[17px] font-bold">{copy.label}</p>
            <p className="text-[15px] text-ink/75">{copy.detail}</p>
          </div>
        </div>

        {copy.tone !== "bad" ? (
          <ol className="grid grid-cols-3 gap-2" aria-label="Progreso del pedido">
            {STEPS.map((step, i) => (
              <li key={step} className="flex flex-col gap-2">
                <span
                  className={`h-1.5 rounded-full transition-colors duration-500 ${i <= reached ? "bg-route" : "bg-ink/10"}`}
                  aria-hidden
                />
                <span className={`text-[12.5px] font-medium ${i <= reached ? "text-ink" : "text-ink-soft"}`}>
                  {step}
                  {i <= reached ? <span className="sr-only"> (completado)</span> : null}
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        <p className="flex items-center gap-2 text-[13.5px] text-ink-soft">
          <MessageCircle aria-hidden className="size-4 text-store" strokeWidth={2} />
          También te avisamos por WhatsApp. Esta página se actualiza sola.
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-surface bg-surface p-5 ring-1 ring-line sm:p-7">
        <h2 className="text-[17px] font-bold">Detalle</h2>
        <ul className="flex flex-col gap-2.5">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 text-[15px]">
              <span>
                <span className="tabular font-semibold">{item.quantity} ×</span> {item.nameSnapshot}
              </span>
              <span className="tabular">{formatUsd(item.unitPriceCents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1.5 border-t border-line pt-3 text-[15px]">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Envío</dt>
            <dd className="tabular">{formatUsd(order.deliveryFeeCents)}</dd>
          </div>
          <div className="flex justify-between text-[17px] font-bold">
            <dt>Total · {order.paymentMethod === "CASH" ? "Efectivo" : "Transferencia"}</dt>
            <dd className="tabular">{formatUsd(order.totalCents)}</dd>
          </div>
        </dl>
        <p className="border-t border-line pt-3 text-[14px] text-ink/75">
          <span className="font-semibold text-ink">Entrega:</span> {order.deliveryAddress}
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/pedidos" className="font-semibold text-brand underline hover:text-brand-deep">
          Ver mis pedidos
        </Link>
        <span aria-hidden className="text-ink/30">·</span>
        <Link href="/comercios" className="font-semibold text-brand underline hover:text-brand-deep">
          Seguir comprando
        </Link>
      </div>
    </main>
  );
}
