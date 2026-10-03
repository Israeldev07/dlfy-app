"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Resumen", exact: true },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/comercios", label: "Comercios" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Panel" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {LINKS.map((l) => {
          const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className="relative flex min-h-11 items-center px-3.5 text-[15px] font-semibold text-ink-soft no-underline transition-colors duration-150 hover:text-ink aria-[current=page]:text-ink"
              >
                {l.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-brand transition-opacity duration-200 ${active ? "opacity-100" : "opacity-0"}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
