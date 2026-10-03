import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StoreForm } from "@/components/admin/store-form";
import { requireAdmin } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Nuevo comercio" };

export default async function NewStorePage() {
  await requireAdmin("/admin/comercios/nuevo");
  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <Link
        href="/admin/comercios"
        className="inline-flex w-fit items-center gap-2 text-[14px] font-medium text-ink/70 no-underline hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
        Comercios
      </Link>
      <h1 className="font-display text-[30px] leading-none tracking-[-0.03em] sm:text-[36px]">Nuevo comercio</h1>
      <div className="rounded-surface bg-surface p-5 ring-1 ring-line sm:p-7">
        <StoreForm />
      </div>
    </main>
  );
}
