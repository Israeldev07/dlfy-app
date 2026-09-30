import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryChips } from "@/components/category-chips";
import { StoreFeature } from "@/components/store-feature";
import { listStores } from "@/modules/catalog/queries";

// Foto del hero (repartidor en moto). Colocar el archivo en public/images/hero-rider.jpg.
const HERO_SRC = "/images/hero-rider.jpg";
const hasHeroImage = existsSync(path.join(process.cwd(), "public", HERO_SRC));

export default async function HomePage() {
  const stores = await listStores().catch(() => []);
  const [featured, ...rest] = stores;

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative isolate overflow-hidden bg-ink">
        {hasHeroImage ? (
          <>
            <Image
              src={HERO_SRC}
              alt="Repartidor de Dfly en moto llegando a Otavalo"
              fill
              priority
              sizes="100vw"
              className="-z-20 object-cover object-[72%_center] sm:object-center"
            />
            {/* Velo de legibilidad: oscurece la zona del texto y deja libre al repartidor. */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-linear-to-t from-ink/85 via-ink/55 to-ink/25 sm:bg-linear-to-r sm:from-ink/85 sm:via-ink/45 sm:via-45% sm:to-transparent sm:to-70%"
            />
          </>
        ) : null}
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-7xl flex-col justify-center gap-7 px-4 py-14 sm:min-h-[600px] sm:gap-8 sm:px-8 sm:py-[72px]">
          <h1 className="max-w-[11ch] font-display text-[44px] leading-[0.96] tracking-[-0.035em] text-balance text-paper [text-shadow:0_2px_18px_rgb(20_20_20/0.55)] sm:text-[60px]">
            Todo lo que necesitas, en una sola{" "}
            <span className="text-route [text-shadow:0_2px_18px_rgb(20_20_20/0.85)]">ruta</span>.
          </h1>
          <p className="max-w-[44ch] text-[16px] leading-[1.55] font-medium text-paper [text-shadow:0_1px_12px_rgb(20_20_20/0.7)]">
            Restaurantes, market, farmacia, licores y mascotas de Otavalo en un solo lugar. Elige qué
            necesitas y te lo llevamos.
          </p>
          <div>
            <Link
              href="/comercios"
              className="press inline-flex h-14 items-center gap-2.5 rounded-control bg-route px-7 text-[15px] font-bold text-ink no-underline hover:bg-route-deep"
            >
              Ver comercios
              <ArrowRight aria-hidden className="size-[18px]" strokeWidth={2.25} />
            </Link>
          </div>
          <CategoryChips tone="dark" />
        </div>
      </section>

      <section className="flex flex-col items-center gap-9 px-4 pt-16 pb-20 sm:px-8 sm:pt-[72px] sm:pb-[84px]">
        <h2 className="text-[15px] font-bold text-ink/80">Comercios en Otavalo</h2>
        {featured ? (
          <>
            <StoreFeature store={featured} />
            {rest.length > 0 ? (
              <ul className="w-full max-w-3xl divide-y divide-line rounded-surface bg-surface ring-1 ring-line">
                {rest.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/comercios/${s.slug}`}
                      className="flex min-h-16 items-center justify-between gap-4 px-5 py-3 text-ink no-underline transition-colors duration-150 hover:bg-ink/[0.03] sm:px-6"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[16px] font-semibold">{s.name}</span>
                        <span className="block text-[13.5px] text-ink/65">
                          {s.sector} · {s.etaMinutes} min
                        </span>
                      </span>
                      <ArrowRight aria-hidden className="size-[18px] flex-none text-store" strokeWidth={1.75} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="max-w-[40ch] text-center text-[15px] text-ink-soft">
            Estamos sumando comercios de Otavalo. Vuelve pronto.
          </p>
        )}
      </section>
    </main>
  );
}
