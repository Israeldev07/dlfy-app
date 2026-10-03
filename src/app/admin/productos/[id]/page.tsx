import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/product-form";
import { centsToInput } from "@/modules/admin/domain";
import { getAdminProduct } from "@/modules/admin/queries";
import { requireAdmin } from "@/modules/identity/session";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProductPage({ params }: PageProps<"/admin/productos/[id]">) {
  const { id } = await params;
  await requireAdmin(`/admin/productos/${id}`);
  const product = await getAdminProduct(id);
  if (!product) notFound();

  return (
    <main className="flex max-w-2xl flex-col gap-6">
      <Link
        href={`/admin/comercios/${product.store.id}`}
        className="inline-flex w-fit items-center gap-2 text-[14px] font-medium text-ink/70 no-underline hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={2} />
        {product.store.name}
      </Link>
      <h1 className="font-display text-[30px] leading-none tracking-[-0.03em] text-balance sm:text-[36px]">{product.name}</h1>
      <div className="rounded-surface bg-surface p-5 ring-1 ring-line sm:p-7">
        <ProductForm
          storeId={product.store.id}
          productId={product.id}
          initial={{
            name: product.name,
            description: product.description ?? "",
            price: centsToInput(product.priceCents),
            isAvailable: product.isAvailable,
          }}
        />
      </div>
    </main>
  );
}
