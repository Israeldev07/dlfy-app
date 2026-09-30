import Link from "next/link";
import { CATEGORIES } from "@/modules/catalog/categories";

type Props = {
  active?: string;
  /** "dark" sobre el hero (foto); "light" sobre el fondo papel. */
  tone?: "dark" | "light";
  /** Incluir la opción "Todos" (catálogo). */
  withAll?: boolean;
};

export function CategoryChips({ active, tone = "light", withAll = false }: Props) {
  const base =
    "inline-flex min-h-10 items-center rounded-full px-4 text-[13px] font-semibold no-underline transition-colors duration-150";
  const idle =
    tone === "dark"
      ? "bg-paper/15 text-paper hover:bg-paper/25"
      : "bg-surface text-ink ring-1 ring-line hover:bg-ink/[0.06]";
  const on = "bg-route text-ink hover:bg-route-deep";

  const items = [
    ...(withAll ? [{ slug: "", label: "Todos" }] : []),
    ...CATEGORIES.map(({ slug, label }) => ({ slug, label })),
  ];

  return (
    <nav aria-label="Categorías">
      <ul className="flex flex-wrap gap-2">
        {items.map(({ slug, label }) => {
          const isActive = (active ?? "") === slug;
          return (
            <li key={slug || "todos"}>
              <Link
                href={slug ? `/comercios?categoria=${slug}` : "/comercios"}
                aria-current={isActive ? "page" : undefined}
                className={`${base} ${isActive ? on : idle}`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
