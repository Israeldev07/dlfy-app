import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import authConfig from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

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
