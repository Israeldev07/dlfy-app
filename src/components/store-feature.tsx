import Link from "next/link";
import { StoreGlyph } from "@/components/store-glyph";
import { categoryLabel, categorySlug } from "@/modules/catalog/categories";
import type { PublicStore } from "@/modules/catalog/queries";

/** Tarjeta grande de comercio, fiel a la del diseño Dfly Home v2. */
export function StoreFeature({ store }: { store: PublicStore }) {
  return (
    <article className="flex w-full max-w-3xl flex-col gap-6 rounded-surface bg-surface p-6 shadow-lift ring-1 ring-line sm:flex-row sm:items-center sm:gap-10 sm:px-9 sm:py-8">
      <div className="flex size-24 flex-none items-center justify-center rounded-xl bg-muted text-store sm:size-[132px]">
        <StoreGlyph className="size-14 sm:size-[76px]" />
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <h3 className="font-display text-[28px] leading-none tracking-[-0.03em] text-balance sm:text-[34px]">
          {store.name}
        </h3>
        <p className="text-[14.5px] leading-snug text-ink/75">
          {categoryLabel(store.category)} · {store.sector} · entrega en {store.etaMinutes} min
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2.5">
          <Link
            href={`/comercios/${store.slug}`}
            className="press inline-flex h-[52px] items-center rounded-control bg-route px-8 text-[15px] font-bold text-ink no-underline hover:bg-route-deep"
          >
            Comprar
          </Link>
          <Link
            href={`/comercios?categoria=${categorySlug(store.category)}`}
            className="inline-flex h-[52px] items-center rounded-control px-5 text-[15px] font-medium text-ink no-underline ring-1 ring-ink/20 transition-colors duration-150 hover:bg-ink/[0.06]"
          >
            Ver más {categoryLabel(store.category).toLowerCase()}
          </Link>
        </div>
      </div>
    </article>
  );
}
