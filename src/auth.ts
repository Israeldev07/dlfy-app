import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { clientIp, RATE_LIMITED_CODE } from "@/lib/rate-limit-rules";
import authConfig from "@/auth.config";

class RateLimitedSignin extends CredentialsSignin {
  code = RATE_LIMITED_CODE;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        // Aquí y no en loginAction: el endpoint /api/auth/callback/credentials también llega a authorize.
        const byIp = await consumeRateLimit("login:ip", clientIp(request.headers));
        const byEmail = await consumeRateLimit("login:email", parsed.data.email);
        if (!byIp.ok || !byEmail.ok) throw new RateLimitedSignin();

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, name: true, email: true, image: true, role: true, password: true },
        });
        // Mismo resultado para email inexistente y contraseña incorrecta.
        if (!user?.password) return null;
        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        const { password: _password, ...safeUser } = user;
        return safeUser;
      },
    }),
  ],
});
