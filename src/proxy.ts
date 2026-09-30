import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Instancia sin adapter: solo lee el JWT y aplica el callback `authorized`.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|avif)$).*)"],
};
