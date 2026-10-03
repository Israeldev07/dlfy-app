import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminStoreName } from "@/modules/admin/queries";
import { requireAdmin } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage({ params }: PageProps<"/admin/comercios/[id]/productos/nuevo">) {
  const { id } = await params;
  await requireAdmin(`/admin/comercios/${id}/productos/nuevo`);
  const store = await getAdminStoreName(id);
  if (!store) notFound();

  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <Link
        href={`/admin/comercios/${store.id}`}
        className="inline-flex w-fit items-center gap-2 text-[14px] font-medium text-ink/70 no-underline hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
        {store.name}
      </Link>
      <h1 className="font-display text-[30px] leading-none tracking-[-0.03em] sm:text-[36px]">Nuevo producto</h1>
      <div className="rounded-surface bg-surface p-5 ring-1 ring-line sm:p-7">
        <ProductForm storeId={store.id} />
      </div>
    </main>
  );
}
