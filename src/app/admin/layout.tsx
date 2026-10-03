import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel Dfly" },
  robots: { index: false, follow: false },
};

// Cada página verifica el rol con `requireAdmin`; el layout solo compone la navegación.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pt-6 pb-20 sm:px-8 sm:pt-8">
      <AdminNav />
      {children}
    </div>
  );
}
