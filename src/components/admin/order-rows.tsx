import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { formatUsd } from "@/modules/catalog/categories";
import { ADMIN_STATUS, dateTime } from "@/modules/admin/copy";
import type { OrderStatus } from "@/generated/prisma/enums";
import { StatusLabel } from "./status";

export type OrderRow = {
  id: string;
  publicCode: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: Date;
  customerName: string;
  store: { name: string };
  _count: { messages: number };
};

/** Lista de pedidos: filas de una línea en escritorio, dos líneas en celular. */
export function OrderRows({ orders }: { orders: OrderRow[] }) {
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-surface bg-surface ring-1 ring-line">
      {orders.map((o) => {
        const status = ADMIN_STATUS[o.status];
        const failed = o._count.messages;
        return (
          <li key={o.id}>
            <Link
              href={`/admin/pedidos/${o.publicCode}`}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3.5 text-ink no-underline transition-colors duration-150 hover:bg-ink/[0.03] sm:grid-cols-[4.5rem_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,11rem)_7.5rem_5.5rem_1.25rem] sm:px-5"
            >
              <span className="tabular text-[15px] font-bold sm:order-1">#{o.publicCode}</span>
              <span className="tabular text-right text-[15px] font-bold sm:order-6">{formatUsd(o.totalCents)}</span>
              <span className="min-w-0 truncate text-[14.5px] sm:order-2">
                <span className="font-semibold">{o.store.name}</span>
                <span className="text-ink-soft sm:hidden"> · {o.customerName}</span>
              </span>
              <span className="flex flex-col items-end gap-0.5 sm:order-4 sm:items-start">
                <StatusLabel {...status} />
                {failed > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-deep">
                    <AlertTriangle aria-hidden className="size-3.5" strokeWidth={2.25} />
                    {failed === 1 ? "1 mensaje falló" : `${failed} mensajes fallaron`}
                  </span>
                ) : null}
              </span>
              <span className="hidden min-w-0 truncate text-[14.5px] text-ink-soft sm:order-3 sm:block">{o.customerName}</span>
              <span className="tabular col-span-2 text-[13px] text-ink-soft sm:order-5 sm:col-span-1">{dateTime.format(o.createdAt)}</span>
              <ArrowRight aria-hidden className="hidden size-[18px] text-ink/35 sm:order-7 sm:block" strokeWidth={1.75} />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
