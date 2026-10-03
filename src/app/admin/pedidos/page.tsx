import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";
import { OrderRows } from "@/components/admin/order-rows";
import { orderFiltersSchema, type OrderFilters } from "@/lib/validations/admin";
import { STATUS_FILTERS } from "@/modules/admin/copy";
import { listAdminOrders, listStoreOptions } from "@/modules/admin/queries";
import { requireAdmin } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Pedidos" };

function hrefWith(filters: OrderFilters, patch: Partial<OrderFilters>) {
  const merged = { ...filters, ...patch };
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v !== undefined && v !== "" && !(k === "pagina" && v === 1)) params.set(k, String(v));
  const qs = params.toString();
  return qs ? `/admin/pedidos?${qs}` : "/admin/pedidos";
}

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireAdmin("/admin/pedidos");
  const raw = await searchParams;
  const filters = orderFiltersSchema.parse({
    estado: raw.estado,
    comercio: raw.comercio,
    q: raw.q,
    pagina: raw.pagina,
  });
  const [{ orders, total, page, pages }, stores] = await Promise.all([listAdminOrders(filters), listStoreOptions()]);
  const filtered = Boolean(filters.estado || filters.comercio || filters.q);

  return (
    <main className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-[30px] leading-none tracking-[-0.03em] sm:text-[36px]">Pedidos</h1>
        <p className="tabular text-[14.5px] text-ink-soft">
          {total === 1 ? "1 pedido" : `${total} pedidos`}
          {filtered ? " con estos filtros" : ""}
        </p>
      </div>

      <nav aria-label="Filtrar por estado" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = (filters.estado ?? "") === f.value;
            return (
              <li key={f.value || "todos"}>
                <Link
                  href={hrefWith(filters, { estado: (f.value || undefined) as OrderFilters["estado"], pagina: undefined })}
                  aria-current={active ? "true" : undefined}
                  className="flex min-h-10 items-center rounded-full px-3.5 text-[14px] font-semibold text-ink no-underline ring-1 ring-ink/15 transition-colors duration-150 hover:bg-ink/[0.05] aria-[current=true]:bg-ink aria-[current=true]:text-paper aria-[current=true]:ring-ink"
                >
                  {f.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        {filters.estado ? <input type="hidden" name="estado" value={filters.estado} /> : null}
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="q" className="text-[14px] font-semibold">
            Buscar
          </label>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-ink/45" strokeWidth={2} />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.q ?? ""}
              placeholder="Código, nombre o celular del cliente"
              className="h-12 w-full rounded-control bg-surface pr-4 pl-11 text-[16px] ring-1 ring-ink/20 outline-none placeholder:text-ink-soft hover:ring-ink/35 focus-visible:ring-2 focus-visible:ring-route-deep"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-60">
          <label htmlFor="comercio" className="text-[14px] font-semibold">
            Comercio
          </label>
          <select
            id="comercio"
            name="comercio"
            defaultValue={filters.comercio ?? ""}
            className="h-12 w-full rounded-control bg-surface px-3.5 text-[16px] ring-1 ring-ink/20 outline-none hover:ring-ink/35 focus-visible:ring-2 focus-visible:ring-route-deep"
          >
            <option value="">Todos los comercios</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="press inline-flex h-12 flex-1 items-center justify-center rounded-control bg-route px-6 text-[15px] font-bold text-ink hover:bg-route-deep sm:flex-none"
          >
            Filtrar
          </button>
          {filtered ? (
            <Link
              href="/admin/pedidos"
              className="inline-flex h-12 items-center rounded-control px-4 text-[15px] font-semibold text-ink-soft no-underline hover:bg-ink/[0.05] hover:text-ink"
            >
              Limpiar
            </Link>
          ) : null}
        </div>
      </form>

      {orders.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-surface bg-surface p-6 ring-1 ring-line">
          <p className="text-[16px] font-semibold">{filtered ? "Ningún pedido coincide con estos filtros." : "Todavía no hay pedidos."}</p>
          <p className="text-[14.5px] text-ink-soft">
            {filtered
              ? "Prueba con otro estado o busca por el código de 5 letras del pedido."
              : "Cuando un cliente haga su primer pedido aparecerá aquí, con su estado y los mensajes de WhatsApp."}
          </p>
        </div>
      ) : (
        <OrderRows orders={orders} />
      )}

      {pages > 1 ? (
        <nav aria-label="Páginas" className="flex items-center justify-between gap-3 text-[14.5px]">
          {page > 1 ? (
            <Link href={hrefWith(filters, { pagina: page - 1 })} className="inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-deep">
              <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
              Más recientes
            </Link>
          ) : (
            <span />
          )}
          <span className="tabular text-ink-soft">
            Página {page} de {pages}
          </span>
          {page < pages ? (
            <Link href={hrefWith(filters, { pagina: page + 1 })} className="inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-deep">
              Más antiguos
              <ArrowRight aria-hidden className="size-4" strokeWidth={2} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </main>
  );
}
