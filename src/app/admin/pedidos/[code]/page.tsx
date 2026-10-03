import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { CancelOrder, RetryMessage } from "@/components/admin/order-actions";
import { StatusLabel } from "@/components/admin/status";
import { formatUsd } from "@/modules/catalog/categories";
import { ACTOR, ADMIN_STATUS, MESSAGE_KIND, MESSAGE_STATUS, PAYMENT, dateTime, timeOnly } from "@/modules/admin/copy";
import { canAdminCancel, canRetryMessage } from "@/modules/admin/domain";
import { getAdminOrder } from "@/modules/admin/queries";
import { requireAdmin } from "@/modules/identity/session";

export async function generateMetadata({ params }: PageProps<"/admin/pedidos/[code]">): Promise<Metadata> {
  const { code } = await params;
  return { title: `Pedido #${code}` };
}

function previewOf(payload: unknown) {
  return payload && typeof payload === "object" && "preview" in payload && typeof payload.preview === "string" ? payload.preview : null;
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/pedidos/[code]">) {
  const { code } = await params;
  await requireAdmin(`/admin/pedidos/${code}`);
  const order = await getAdminOrder(code.toUpperCase());
  if (!order) notFound();

  const status = ADMIN_STATUS[order.status];
  const storeWasContacted = order.messages.some((m) => m.kind === "STORE_REQUEST" && m.status === "SENT");
  const phoneDigits = order.customerPhone.replace(/\D/g, "");

  return (
    <main className="flex flex-col gap-6">
      <Link
        href="/admin/pedidos"
        className="inline-flex w-fit items-center gap-2 text-[14px] font-medium text-ink/70 no-underline hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
        Pedidos
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col gap-2">
          <h1 className="tabular font-display text-[30px] leading-none tracking-[-0.03em] sm:text-[36px]">#{order.publicCode}</h1>
          <p className="text-[15px] text-ink-soft">
            <span className="font-semibold text-ink">{order.store.name}</span> · {order.store.sector} · {dateTime.format(order.createdAt)}
          </p>
        </div>
        <StatusLabel {...status} className="text-[16px]" />
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="productos" className="rounded-surface bg-surface p-5 ring-1 ring-line sm:p-6">
            <h2 id="productos" className="mb-4 text-[17px] font-bold">
              Productos
            </h2>
            <ul className="flex flex-col gap-2.5">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-4 text-[15px]">
                  <span>
                    <span className="tabular font-semibold">{i.quantity} ×</span> {i.nameSnapshot}
                  </span>
                  <span className="tabular flex-none">{formatUsd(i.unitPriceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Productos</dt>
                <dd className="tabular">{formatUsd(order.subtotalCents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Envío</dt>
                <dd className="tabular">{formatUsd(order.deliveryFeeCents)}</dd>
              </div>
              <div className="flex justify-between pt-1 text-[17px] font-bold">
                <dt>Total · {PAYMENT[order.paymentMethod]}</dt>
                <dd className="tabular">{formatUsd(order.totalCents)}</dd>
              </div>
            </dl>
            {order.notes ? (
              <p className="mt-4 rounded-control bg-muted px-4 py-3 text-[14.5px]">
                <span className="font-semibold">Indicaciones del cliente:</span> {order.notes}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="mensajes" className="flex flex-col gap-3">
            <h2 id="mensajes" className="text-[17px] font-bold">
              Mensajes de WhatsApp
            </h2>
            {order.messages.length === 0 ? (
              <p className="text-[14.5px] text-ink-soft">Este pedido no tiene mensajes registrados.</p>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-surface bg-surface ring-1 ring-line">
                {order.messages.map((m) => {
                  const ms = MESSAGE_STATUS[m.status];
                  const preview = previewOf(m.payload);
                  return (
                    <li key={m.id} className="flex flex-col gap-1.5 px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                        <span className="text-[15px] font-semibold">{MESSAGE_KIND[m.kind]}</span>
                        <StatusLabel {...ms} />
                      </div>
                      {preview ? <p className="text-[14px] leading-snug text-ink-soft">{preview}</p> : null}
                      <p className="tabular text-[13px] text-ink-soft">
                        {timeOnly.format(m.updatedAt)}
                        {m.attempts > 0 ? ` · ${m.attempts === 1 ? "1 intento" : `${m.attempts} intentos`}` : ""}
                      </p>
                      {m.lastError && m.status !== "SENT" ? (
                        <p className="text-[13.5px] font-medium break-words text-brand-deep">{m.lastError}</p>
                      ) : null}
                      {canRetryMessage(m.kind, m.status, order.status) ? (
                        <div className="pt-1">
                          <RetryMessage messageId={m.id} />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="historial" className="flex flex-col gap-3">
            <h2 id="historial" className="text-[17px] font-bold">
              Historial
            </h2>
            <ol className="flex flex-col gap-0 rounded-surface bg-surface px-5 py-2 ring-1 ring-line">
              {order.events.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-4 border-b border-line py-3 text-[14.5px] last:border-b-0">
                  <span>
                    <span className="font-semibold">{e.from === null ? "Pedido creado" : ADMIN_STATUS[e.to].label}</span>
                    <span className="text-ink-soft"> · {ACTOR[e.actor]}</span>
                  </span>
                  <span className="tabular flex-none text-[13.5px] text-ink-soft">{dateTime.format(e.createdAt)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-5 rounded-surface bg-surface p-5 shadow-lift ring-1 ring-line sm:p-6 lg:sticky lg:top-24">
          <div className="flex flex-col gap-1">
            <h2 className="text-[13px] font-medium text-ink-soft">Cliente</h2>
            <p className="text-[17px] font-bold">{order.customerName}</p>
            <p className="text-[14px] break-all text-ink-soft">{order.user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${order.customerPhone}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-control px-3.5 text-[15px] font-semibold text-ink no-underline ring-1 ring-ink/15 hover:bg-ink/[0.05]"
            >
              <Phone aria-hidden className="size-4 text-store" strokeWidth={2} />
              <span className="tabular">{order.customerPhone}</span>
            </a>
            <a
              href={`https://wa.me/${phoneDigits}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-control px-3.5 text-[15px] font-semibold text-ink no-underline ring-1 ring-ink/15 hover:bg-ink/[0.05]"
            >
              <MessageCircle aria-hidden className="size-4 text-store" strokeWidth={2} />
              WhatsApp
            </a>
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-[13px] font-medium text-ink-soft">Entrega</h2>
            <p className="text-[15px] leading-snug">{order.deliveryAddress}</p>
          </div>
          {order.respondedAt ? (
            <div className="flex flex-col gap-1">
              <h2 className="text-[13px] font-medium text-ink-soft">Respuesta del comercio</h2>
              <p className="tabular text-[15px]">{dateTime.format(order.respondedAt)}</p>
            </div>
          ) : null}
          {canAdminCancel(order.status) ? (
            <div className="border-t border-line pt-5">
              <CancelOrder orderId={order.id} storeWillBeNotified={storeWasContacted} />
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
