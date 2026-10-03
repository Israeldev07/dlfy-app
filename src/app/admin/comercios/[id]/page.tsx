import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, Pencil, Plus } from "lucide-react";
import { StoreForm } from "@/components/admin/store-form";
import { ToggleButton } from "@/components/admin/toggle-button";
import { formatUsd } from "@/modules/catalog/categories";
import { toggleProductAvailableAction } from "@/modules/admin/actions";
import { getAdminStore } from "@/modules/admin/queries";
import { requireAdmin } from "@/modules/identity/session";

export async function generateMetadata({ params }: PageProps<"/admin/comercios/[id]">): Promise<Metadata> {
  const { id } = await params;
  const store = await getAdminStore(id);
  return { title: store?.name ?? "Comercio" };
}

export default async function AdminStorePage({ params, searchParams }: PageProps<"/admin/comercios/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/comercios/${id}`);
  const store = await getAdminStore(id);
  if (!store) notFound();
  const justCreated = (await searchParams).nuevo === "1";
  const available = store.products.filter((p) => p.isAvailable).length;

  return (
    <main className="flex flex-col gap-6">
      <Link
        href="/admin/comercios"
        className="inline-flex w-fit items-center gap-2 text-[14px] font-medium text-ink/70 no-underline hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
        Comercios
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-[30px] leading-none tracking-[-0.03em] text-balance sm:text-[36px]">{store.name}</h1>
        {store.isActive ? (
          <Link
            href={`/comercios/${store.slug}`}
            className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-brand hover:text-brand-deep"
          >
            Ver como cliente
            <ExternalLink aria-hidden className="size-4" strokeWidth={2} />
          </Link>
        ) : null}
      </div>

      {justCreated ? (
        <p role="status" className="flex items-center gap-2 rounded-control bg-route/[0.12] px-4 py-3 text-[14.5px] font-medium">
          <CheckCircle2 aria-hidden className="size-5 flex-none text-route-deep" strokeWidth={2} />
          Comercio creado. Ahora agrega sus productos.
        </p>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <section aria-labelledby="productos" className="flex flex-col gap-3 lg:order-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="productos" className="text-[20px] font-bold tracking-[-0.01em]">
              Productos
              <span className="tabular ml-2 text-[14.5px] font-medium text-ink-soft">
                {available} de {store.products.length} disponibles
              </span>
            </h2>
            <Link
              href={`/admin/comercios/${store.id}/productos/nuevo`}
              className="press inline-flex h-11 items-center gap-2 rounded-control bg-route px-4 text-[15px] font-bold text-ink no-underline hover:bg-route-deep"
            >
              <Plus aria-hidden className="size-[18px]" strokeWidth={2.25} />
              Agregar producto
            </Link>
          </div>
          {store.products.length === 0 ? (
            <p className="rounded-surface bg-surface p-5 text-[14.5px] text-ink-soft ring-1 ring-line">
              Sin productos todavía. Los clientes no podrán pedir aquí hasta que agregues al menos uno disponible.
            </p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-surface bg-surface ring-1 ring-line">
              {store.products.map((p) => (
                <li key={p.id} className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${p.isAvailable ? "" : "bg-ink/[0.025]"}`}>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[15px] font-semibold ${p.isAvailable ? "" : "text-ink-soft"}`}>{p.name}</p>
                    <p className="text-[13.5px] text-ink-soft">
                      <span className="tabular">{formatUsd(p.priceCents)}</span>
                      {p.isAvailable ? "" : " · Agotado"}
                    </p>
                  </div>
                  <Link
                    href={`/admin/productos/${p.id}`}
                    aria-label={`Editar ${p.name}`}
                    className="inline-flex size-10 items-center justify-center rounded-control text-ink/70 hover:bg-ink/[0.06] hover:text-ink"
                  >
                    <Pencil aria-hidden className="size-4" strokeWidth={2} />
                  </Link>
                  <form action={toggleProductAvailableAction}>
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="isAvailable" value={String(!p.isAvailable)} />
                    <ToggleButton pendingLabel="Guardando…">{p.isAvailable ? "Agotado" : "Disponible"}</ToggleButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="datos" className="flex flex-col gap-3 lg:order-1">
          <h2 id="datos" className="text-[20px] font-bold tracking-[-0.01em]">
            Datos del comercio
          </h2>
          <div className="rounded-surface bg-surface p-5 ring-1 ring-line sm:p-6">
            <StoreForm
              storeId={store.id}
              initial={{
                name: store.name,
                description: store.description ?? "",
                category: store.category,
                sector: store.sector,
                etaMinutes: String(store.etaMinutes),
                whatsappPhone: store.whatsappPhone,
                isActive: store.isActive,
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
