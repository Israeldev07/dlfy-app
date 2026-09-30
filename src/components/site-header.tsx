import Link from "next/link";
import { auth } from "@/auth";
import { ProfileMenu } from "@/components/profile-menu";

export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-brand bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:h-[68px] sm:px-8">
        <Link
          href={user ? "/comercios" : "/"}
          className="font-display text-[22px] tracking-[-0.03em] text-brand no-underline hover:text-brand-deep"
        >
          Dfly
        </Link>
        <ProfileMenu user={user ? { name: user.name ?? null, email: user.email ?? null } : null} />
      </div>
    </header>
  );
}
