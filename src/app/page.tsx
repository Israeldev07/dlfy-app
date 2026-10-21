import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CategoryChips } from "@/components/category-chips";
import { HeroVideo } from "@/components/hero-video";
import { StoreFeature } from "@/components/store-feature";
import { listStores } from "@/modules/catalog/queries";

/** Posición en la entrada escalonada del hero (ver `.hero-in` en globals.css). */
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export default async function HomePage() {
  const stores = await listStores().catch(() => []);
  const [featured, ...rest] = stores;

  return (
    <main className="flex flex-1 flex-col">
      {/* Móvil y tablet: video arriba y texto debajo sobre azul oscuro. Escritorio: video de fondo
          contenido a la derecha; su fondo no es plano, así que el borde izquierdo se desvanece hacia
          el azul medio del MP4 (`--color-hero`) y un velo a la izquierda deja leer el texto. */}
      <section className="relative isolate overflow-hidden bg-hero-deep lg:bg-hero">
        <div className="relative lg:absolute lg:inset-0 lg:-z-10">
          <HeroVideo className="block aspect-[4/3] w-full bg-hero object-cover object-[85%_50%] sm:aspect-video lg:ml-auto lg:h-full lg:w-auto lg:max-w-none lg:[mask-image:linear-gradient(to_right,transparent,black_30%)]" />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-b from-transparent from-75% to-hero-deep lg:bg-linear-to-r lg:from-hero-deep/80 lg:from-0% lg:via-hero-deep/40 lg:via-35% lg:to-transparent lg:to-55%"
          />
        </div>
        <div className="mx-auto flex w-full max-w-7xl flex-col justify-center gap-7 px-4 pt-6 pb-14 sm:gap-8 sm:px-8 sm:pb-[72px] lg:min-h-[600px] lg:pt-[72px]">
          <h1
            style={step(0)}
            className="hero-in max-w-[11ch] font-display text-[44px] leading-[0.96] tracking-[-0.035em] text-balance text-paper sm:text-[60px]"
          >
            Todo lo que necesitas, en una sola <span className="text-route">ruta</span>.
          </h1>
          <p style={step(1)} className="hero-in max-w-[44ch] text-[16px] leading-[1.55] font-medium text-paper">
            Restaurantes, market, farmacia, licores y mascotas de Otavalo en un solo lugar. Elige qué
            necesitas y te lo llevamos.
          </p>
          <div style={step(2)} className="hero-in">
            <Link
              href="/comercios"
              className="press inline-flex h-14 items-center gap-2.5 rounded-control bg-route px-7 text-[15px] font-bold text-ink no-underline hover:bg-route-deep"
            >
              Ver comercios
              <ArrowRight aria-hidden className="size-[18px]" strokeWidth={2.25} />
            </Link>
          </div>
          <div style={step(3)} className="hero-in">
            <CategoryChips tone="dark" />
          </div>
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
