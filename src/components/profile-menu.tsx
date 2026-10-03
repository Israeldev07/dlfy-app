"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Package, UserPlus, UserRound } from "lucide-react";
import { signOutAction } from "@/modules/identity/actions";

type Props = {
  user: { name: string | null; email: string | null; isAdmin?: boolean } | null;
};

const itemClass =
  "flex min-h-11 w-full items-center gap-3 rounded-[6px] px-3 text-left text-[15px] font-medium text-ink no-underline transition-colors duration-150 hover:bg-ink/[0.06] focus-visible:bg-ink/[0.06]";

export function ProfileMenu({ user }: Props) {
  const pathname = usePathname();
  // Se guarda la ruta donde se abrió: al navegar, el menú queda cerrado sin efectos extra.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (value: boolean) => setOpenedAt(value ? pathname : null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpenedAt(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpenedAt(null);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const firstName = user?.name?.split(" ")[0];

  return (
    <div ref={rootRef} className="sm:relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 items-center gap-2 rounded-control px-3.5 text-[14px] font-medium text-ink transition-colors duration-150 hover:bg-ink/[0.06] aria-expanded:bg-ink/[0.06]"
      >
        <UserRound aria-hidden className="size-[18px]" strokeWidth={1.75} />
        <span>Mi perfil</span>
        <ChevronDown
          aria-hidden
          className={`size-4 text-ink/50 transition-transform duration-200 ease-(--ease-out) ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      <div
        id={menuId}
        data-open={open}
        inert={!open}
        className="menu-panel absolute inset-x-0 top-full z-50 border-b border-line bg-surface p-2 shadow-pop sm:inset-x-auto sm:right-0 sm:mt-2 sm:w-64 sm:rounded-surface sm:border"
      >
        {user ? (
          <>
            <p className="truncate px-3 pt-2 pb-2.5 text-[13px] text-ink-soft">
              Hola{firstName ? `, ${firstName}` : ""}
              {user.email ? <span className="block truncate text-ink/60">{user.email}</span> : null}
            </p>
            <Link href="/perfil" className={itemClass}>
              <UserRound aria-hidden className="size-[18px] text-store" strokeWidth={1.75} />
              Mi perfil
            </Link>
            <Link href="/pedidos" className={itemClass}>
              <Package aria-hidden className="size-[18px] text-store" strokeWidth={1.75} />
              Mis pedidos
            </Link>
            {user.isAdmin ? (
              <Link href="/admin" className={itemClass}>
                <LayoutDashboard aria-hidden className="size-[18px] text-store" strokeWidth={1.75} />
                Panel Dfly
              </Link>
            ) : null}
            <div className="my-1.5 h-px bg-line" />
            <form action={signOutAction}>
              <button type="submit" className={`${itemClass} text-brand-deep`}>
                <LogOut aria-hidden className="size-[18px]" strokeWidth={1.75} />
                Cerrar sesión
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className={itemClass}>
              <LogIn aria-hidden className="size-[18px] text-store" strokeWidth={1.75} />
              Iniciar sesión
            </Link>
            <Link
              href="/registro"
              className="press mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-route px-3 text-[15px] font-bold text-ink no-underline hover:bg-route-deep"
            >
              <UserPlus aria-hidden className="size-[18px]" strokeWidth={2} />
              Crear cuenta
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
