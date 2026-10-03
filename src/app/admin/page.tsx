import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { OrderRows } from "@/components/admin/order-rows";
import { formatUsd } from "@/modules/catalog/categories";
import { getTodaySummary } from "@/modules/admin/queries";
import { requireAdmin } from "@/modules/identity/session";

// El template del layout no aplica a la página de su mismo segmento.
export const metadata: Metadata = { title: { absolute: "Resumen · Panel Dfly" } };

const longDate = new Intl.DateTimeFormat("es-EC", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Guayaquil",
});

export default async function AdminHomePage() {
  await requireAdmin("/admin");
  const s = await getTodaySummary();

  const ledger = [
    { label: "Pedidos", value: String(s.total) },
    { label: "Esperando", value: String(s.waiting) },
    { label: "Aceptados", value: String(s.accepted) },
    { label: "Rechazados", value: String(s.rejected) },
    { label: "Sin respuesta", value: String(s.expired) },
    { label: "Cancelados", value: String(s.cancelled) },
  ];

  return (
    <main className="flex flex-col gap-10">
      <section aria-labelledby="hoy" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <h1 id="hoy" className="font-display text-[30px] leading-none tracking-[-0.03em] sm:text-[36px]">
            Hoy
            <span className="ml-3 align-middle font-sans text-[15px] font-medium tracking-normal text-ink-soft first-letter:uppercase">
              {longDate.format(new Date())}
            </span>
          </h1>
          <p className="text-[15px] text-ink-soft">
            Ventas aceptadas <span className="tabular ml-1 text-[22px] font-bold text-ink">{formatUsd(s.acceptedSalesCents)}</span>
          </p>
        </div>

        <dl className="grid grid-cols-3 overflow-hidden rounded-surface bg-surface ring-1 ring-line sm:grid-cols-6">
          {ledger.map((cell, i) => (
            <div
              key={cell.label}
              className={`flex flex-col gap-0.5 border-line px-4 py-3.5 sm:px-5 ${i % 3 !== 0 ? "border-l" : ""} ${i >= 3 ? "border-t sm:border-t-0" : ""} ${i === 3 ? "sm:border-l" : ""}`}
            >
              <dt className="text-[13px] font-medium text-ink-soft">{cell.label}</dt>
              <dd className="tabular text-[26px] leading-tight font-bold">{cell.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="atencion" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="atencion" className="text-[20px] font-bold tracking-[-0.01em]">
            Requieren atención
          </h2>
          <Link href="/admin/pedidos" className="text-[14.5px] font-semibold text-brand hover:text-brand-deep">
            Ver todos los pedidos
          </Link>
        </div>
        {s.attention.length === 0 ? (
          <p className="flex items-center gap-2.5 rounded-surface bg-surface px-5 py-4 text-[15px] ring-1 ring-line">
            <CheckCircle2 aria-hidden className="size-5 flex-none text-route-deep" strokeWidth={2} />
            Todo en orden: ningún pedido vencido ni mensajes sin enviar.
          </p>
        ) : (
          <>
            <p className="text-[14.5px] text-ink-soft">
              Pedidos sin respuesta del comercio o con mensajes de WhatsApp que no salieron. Llama al comercio o reintenta el envío desde el detalle.
            </p>
            <OrderRows orders={s.attention} />
          </>
        )}
      </section>
    </main>
  );
}
