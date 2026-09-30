import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { CategoryChips } from "@/components/category-chips";
import { StoreGlyph } from "@/components/store-glyph";
import { categoryFromSlug, categoryLabel } from "@/modules/catalog/categories";
import { listStores } from "@/modules/catalog/queries";
import { requireUser } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Comercios" };

export default async function StoresPage({ searchParams }: PageProps<"/comercios">) {
  const { categoria } = await searchParams;
  const slug = typeof categoria === "string" ? categoria : undefined;
  const category = categoryFromSlug(slug);

  const user = await requireUser(slug ? `/comercios?categoria=${slug}` : "/comercios");
  const stores = await listStores(category?.value);
  const firstName = user.name?.split(" ")[0];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-10 pb-32 sm:px-8 sm:pt-14">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-[34px] leading-none tracking-[-0.03em] text-balance sm:text-[44px]">
          {firstName ? `${firstName}, ¿qué te llevamos hoy?` : "¿Qué te llevamos hoy?"}
        </h1>
        <p className="text-[15px] text-ink-soft">
          {category ? `${category.label} en Otavalo` : "Todos los comercios de Otavalo"} ·{" "}
          <span className="tabular">{stores.length}</span> {stores.length === 1 ? "disponible" : "disponibles"}
        </p>
      </div>

      <CategoryChips active={category?.slug ?? ""} withAll />

      {stores.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-surface bg-surface p-6 ring-1 ring-line sm:p-8">
          <p className="text-[17px] font-semibold">
            Todavía no hay comercios de {category?.label.toLowerCase() ?? "esta categoría"}.
          </p>
          <p className="text-[15px] text-ink-soft">Estamos sumando locales de Otavalo. Mientras tanto, mira las demás categorías.</p>
          <Link href="/comercios" className="font-semibold text-brand underline hover:text-brand-deep">
            Ver todos los comercios
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {stores.map((s) => (
            <li key={s.id}>
              <Link
                href={`/comercios/${s.slug}`}
                className="group flex h-full items-center gap-4 rounded-surface bg-surface p-4 text-ink no-underline ring-1 ring-line transition-shadow duration-200 hover:shadow-lift sm:p-5"
              >
                <span className="flex size-16 flex-none items-center justify-center rounded-xl bg-muted text-store sm:size-[72px]">
                  <StoreGlyph className="size-9 sm:size-10" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[17px] font-bold tracking-[-0.01em]">{s.name}</span>
                  <span className="truncate text-[13.5px] text-ink/65">
                    {categoryLabel(s.category)} · {s.sector}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-store">
                    <Clock aria-hidden className="size-3.5" strokeWidth={2} />
                    <span className="tabular">{s.etaMinutes}</span> min
                  </span>
                </span>
                <ArrowRight
                  aria-hidden
                  className="size-5 flex-none text-ink/35 transition-[color,transform] duration-200 ease-(--ease-out) group-hover:translate-x-0.5 group-hover:text-route-deep motion-reduce:group-hover:translate-x-0"
                  strokeWidth={1.75}
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
