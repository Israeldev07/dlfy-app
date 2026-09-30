import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatUsd } from "@/modules/catalog/categories";
import { requireUser } from "@/modules/identity/session";
import { listCustomerOrders } from "@/modules/ordering/queries";
import { STATUS_COPY } from "@/modules/ordering/status-copy";

export const metadata: Metadata = { title: "Mis pedidos" };

const dateFmt = new Intl.DateTimeFormat("es-EC", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Guayaquil",
});

export default async function OrdersPage() {
  const user = await requireUser("/pedidos");
  const orders = await listCustomerOrders(user.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pt-8 pb-20 sm:px-8 sm:pt-12">
      <h1 className="font-display text-[32px] leading-none tracking-[-0.03em] sm:text-[40px]">Mis pedidos</h1>
      {orders.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-surface bg-surface p-6 ring-1 ring-line sm:p-8">
          <p className="text-[17px] font-semibold">Aún no has hecho pedidos.</p>
          <Link
            href="/comercios"
            className="press inline-flex h-12 items-center rounded-control bg-route px-6 text-[15px] font-bold text-ink no-underline hover:bg-route-deep"
          >
            Ver comercios
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-surface bg-surface ring-1 ring-line">
          {orders.map((o) => {
            const copy = STATUS_COPY[o.status];
            return (
              <li key={o.publicCode}>
                <Link
                  href={`/pedidos/${o.publicCode}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 text-ink no-underline transition-colors duration-150 hover:bg-ink/[0.03] sm:px-6"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[16px] font-semibold">{o.store.name}</span>
                    <span className="block text-[13.5px] text-ink-soft">
                      <span className="tabular">#{o.publicCode}</span> · {dateFmt.format(o.createdAt)} ·{" "}
                      <span
                        className={
                          copy.tone === "ok" ? "font-semibold text-route-deep" : copy.tone === "bad" ? "font-semibold text-brand-deep" : "font-semibold text-store"
                        }
                      >
                        {copy.label}
                      </span>
                    </span>
                  </span>
                  <span className="flex flex-none items-center gap-3">
                    <span className="tabular text-[15px] font-bold">{formatUsd(o.totalCents)}</span>
                    <ArrowRight aria-hidden className="size-[18px] text-ink/35" strokeWidth={1.75} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
