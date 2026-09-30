import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireUser } from "@/modules/identity/session";
import { deliveryFeeCents } from "@/modules/ordering/domain";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Confirmar pedido" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const [profile, address] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { phone: true } }),
    prisma.address.findFirst({
      where: { userId: user.id, isDefault: true },
      select: { line: true, sector: true, reference: true },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pt-8 pb-20 sm:px-8 sm:pt-12">
      <h1 className="font-display text-[32px] leading-none tracking-[-0.03em] sm:text-[40px]">Confirma tu pedido</h1>
      <CheckoutForm
        deliveryFeeCents={deliveryFeeCents()}
        defaults={{
          phone: profile?.phone ? profile.phone.replace(/^\+593/, "0") : "",
          addressLine: address?.line ?? "",
          sector: address?.sector ?? "",
          reference: address?.reference ?? "",
        }}
      />
    </main>
  );
}
