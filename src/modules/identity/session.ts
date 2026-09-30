import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Verifica la sesión junto al dato; el proxy es solo una capa optimista. */
export async function requireUser(returnTo: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  }
  return session.user;
}
