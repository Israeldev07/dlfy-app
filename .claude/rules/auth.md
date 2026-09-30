# Autenticación — Auth.js (NextAuth.js v5)

## Login dual
El sistema soporta dos vías de inicio de sesión que conviven sobre la misma tabla `User`:
1. **Credenciales** (email + contraseña) con el provider `Credentials`.
2. **OAuth** (Google como proveedor principal; se pueden añadir otros) con enlace a `Account`.

## Arquitectura (config dividida)
- `src/auth.config.ts`: objeto `NextAuthConfig` **sin adapter** (providers, `pages`, callbacks). Es lo que importa el proxy.
- `src/auth.ts`: `NextAuth({ adapter: PrismaAdapter(prisma), session: { strategy: "jwt" }, ...authConfig })` y exporta `{ handlers, auth, signIn, signOut }`.
- `src/app/api/auth/[...nextauth]/route.ts`: `export const { GET, POST } = handlers`.
- `src/proxy.ts`: instancia `NextAuth(authConfig)` sin adapter y exporta `auth` como `proxy`.

## Reglas
- Estrategia de sesión **`jwt`** obligatoria (el provider Credentials no funciona con sesiones en base de datos).
- Contraseñas hasheadas con **bcrypt** (o argon2); nunca almacenar ni loguear texto plano. El campo `password` en `User` es opcional (usuarios OAuth no lo tienen).
- `authorize()` valida las credenciales con Zod antes de consultar la base de datos y devuelve `null` ante credenciales inválidas, sin revelar si el email existe.
- Datos extra en sesión (p. ej. `id`, `role`) se propagan con los callbacks `jwt` y `session`, y se tipan extendiendo los módulos `next-auth` / `@auth/core/jwt` en `src/types/next-auth.d.ts`.
- Obtener la sesión en servidor con `await auth()`. En componentes cliente, `useSession` dentro de `SessionProvider` solo si es imprescindible.
- Cada Server Action y Route Handler protegido verifica la sesión (y el rol si aplica) por sí mismo; no depender solo del proxy.
- Vinculación de cuentas OAuth con un email ya registrado por credenciales: no habilitar `allowDangerousEmailAccountLinking` salvo decisión explícita.
- Variables de entorno: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL` (si aplica en producción), `DATABASE_URL`.
- Páginas personalizadas en `pages: { signIn: "/login" }`.
