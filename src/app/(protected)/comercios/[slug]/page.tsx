import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { StoreGlyph } from "@/components/store-glyph";
import { ProductList } from "@/components/cart/product-list";
import { categoryLabel, categorySlug } from "@/modules/catalog/categories";
import { getStoreWithProducts } from "@/modules/catalog/queries";
import { requireUser } from "@/modules/identity/session";

export async function generateMetadata({ params }: PageProps<"/comercios/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreWithProducts(slug);
  return { title: store?.name ?? "Comercio" };
}

export default async function StorePage({ params }: PageProps<"/comercios/[slug]">) {
  const { slug } = await params;
  await requireUser(`/comercios/${slug}`);
  const store = await getStoreWithProducts(slug);
  if (!store) notFound();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-8 pb-32 sm:px-8 sm:pt-12">
      <Link
        href={`/comercios?categoria=${categorySlug(store.category)}`}
        className="inline-flex w-fit items-center gap-2 text-[14px] font-medium text-ink/70 no-underline hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
        {categoryLabel(store.category)}
      </Link>

      <header className="flex items-center gap-5">
        <span className="flex size-20 flex-none items-center justify-center rounded-xl bg-muted text-store sm:size-24">
          <StoreGlyph className="size-11 sm:size-14" />
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-display text-[30px] leading-none tracking-[-0.03em] text-balance sm:text-[40px]">
            {store.name}
          </h1>
          <p className="flex flex-wrap items-center gap-x-2 text-[14.5px] text-ink/70">
            <span>{store.sector}, {store.city}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-store">
              <Clock aria-hidden className="size-3.5" strokeWidth={2} />
              <span className="tabular">{store.etaMinutes}</span> min
            </span>
          </p>
          {store.description ? <p className="text-[15px] text-ink-soft">{store.description}</p> : null}
        </div>
      </header>

      {store.products.length === 0 ? (
        <p className="rounded-surface bg-surface p-6 text-[15px] text-ink-soft ring-1 ring-line">
          Este comercio aún no tiene productos disponibles.
        </p>
      ) : (
        <ProductList
          store={{ id: store.id, slug: store.slug, name: store.name, category: store.category }}
          products={store.products}
        />
      )}
      {store.category === "LIQUOR" ? (
        <p className="text-[13.5px] text-ink-soft">
          Venta solo a mayores de 18 años. Te pediremos confirmarlo al hacer el pedido.
        </p>
      ) : null}
    </main>
  );
}
