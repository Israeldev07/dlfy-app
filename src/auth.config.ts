import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

const PROTECTED_PREFIXES = ["/comercios", "/checkout", "/pedidos", "/perfil", "/admin"];
const AUTH_PAGES = ["/login", "/registro"];

/**
 * Config sin adapter ni acceso a base de datos: la importa el proxy.
 * El provider Credentials se añade en `auth.ts` porque consulta Prisma.
 */
export default {
  providers: [Google],
  pages: { signIn: "/login" },
  callbacks: {
    // Capa optimista: la autorización real se verifica junto al dato.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const path = nextUrl.pathname;

      if (AUTH_PAGES.some((p) => path.startsWith(p))) {
        return isLoggedIn ? Response.redirect(new URL("/comercios", nextUrl)) : true;
      }
      if (path.startsWith("/admin")) {
        return auth?.user?.role === "ADMIN";
      }
      if (PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
        return isLoggedIn;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role ?? "CUSTOMER";
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
