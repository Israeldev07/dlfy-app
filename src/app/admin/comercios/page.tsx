import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { StatusLabel } from "@/components/admin/status";
import { ToggleButton } from "@/components/admin/toggle-button";
import { categoryLabel } from "@/modules/catalog/categories";
import { toggleStoreActiveAction } from "@/modules/admin/actions";
import { listAdminStores } from "@/modules/admin/queries";
import { requireAdmin } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Comercios" };

export default async function AdminStoresPage() {
  await requireAdmin("/admin/comercios");
  const stores = await listAdminStores();

  return (
    <main className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[30px] leading-none tracking-[-0.03em] sm:text-[36px]">Comercios</h1>
        <Link
          href="/admin/comercios/nuevo"
          className="press inline-flex h-11 items-center gap-2 rounded-control bg-route px-4 text-[15px] font-bold text-ink no-underline hover:bg-route-deep"
        >
          <Plus aria-hidden className="size-[18px]" strokeWidth={2.25} />
          Nuevo comercio
        </Link>
      </div>

      {stores.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-surface bg-surface p-6 ring-1 ring-line">
          <p className="text-[16px] font-semibold">Aún no hay comercios.</p>
          <p className="text-[14.5px] text-ink-soft">
            Crea el primero con su WhatsApp: ahí le llegarán los pedidos para aceptar o rechazar.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-surface bg-surface ring-1 ring-line">
          {stores.map((s) => (
            <li key={s.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
              <Link href={`/admin/comercios/${s.id}`} className="group min-w-0 flex-1 text-ink no-underline">
                <span className="block truncate text-[16px] font-semibold group-hover:underline">{s.name}</span>
                <span className="block truncate text-[13.5px] text-ink-soft">
                  {categoryLabel(s.category)} · {s.sector} · <span className="tabular">{s.etaMinutes} min</span> ·{" "}
                  {s._count.products === 1 ? "1 producto" : `${s._count.products} productos`}
                </span>
              </Link>
              <StatusLabel
                label={s.isActive ? "Visible" : "Oculto"}
                tone={s.isActive ? "ok" : "muted"}
                className="hidden sm:inline-flex"
              />
              <form action={toggleStoreActiveAction}>
                <input type="hidden" name="storeId" value={s.id} />
                <input type="hidden" name="isActive" value={String(!s.isActive)} />
                <ToggleButton pendingLabel="Guardando…">{s.isActive ? "Ocultar" : "Mostrar"}</ToggleButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
