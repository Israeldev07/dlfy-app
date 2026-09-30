import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/modules/identity/session";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function ProfilePage() {
  const user = await requireUser("/perfil");
  const profile = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { name: true, email: true, phone: true, addresses: { where: { isDefault: true }, select: { line: true, sector: true, city: true, reference: true } } },
  });
  const address = profile.addresses[0];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pt-8 pb-20 sm:px-8 sm:pt-12">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-[32px] leading-none tracking-[-0.03em] sm:text-[40px]">Mi perfil</h1>
        <p className="text-[15px] text-ink-soft">{profile.email}</p>
      </div>

      <section className="flex flex-col gap-5 rounded-surface bg-surface p-5 ring-1 ring-line sm:p-7">
        <h2 className="text-[17px] font-bold">Tus datos</h2>
        <ProfileForm name={profile.name ?? ""} phone={profile.phone ? profile.phone.replace(/^\+593/, "0") : ""} />
      </section>

      <section className="flex flex-col gap-2 rounded-surface bg-surface p-5 ring-1 ring-line sm:p-7">
        <h2 className="text-[17px] font-bold">Dirección de entrega</h2>
        {address ? (
          <p className="text-[15px] text-ink/80">
            {address.line}, {address.sector}, {address.city}
            {address.reference ? ` (${address.reference})` : ""}
          </p>
        ) : (
          <p className="text-[15px] text-ink-soft">La guardamos automáticamente con tu primer pedido.</p>
        )}
      </section>

      <Link href="/pedidos" className="w-fit font-semibold text-brand underline hover:text-brand-deep">
        Ver mis pedidos
      </Link>
    </main>
  );
}
