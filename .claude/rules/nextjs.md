# Next.js

- Usar **App Router** (`src/app`). No usar Pages Router.
- Server Components por defecto. Marcar `"use client"` solo en hojas interactivas del árbol; no subir el límite cliente innecesariamente.
- Mutaciones mediante **Server Actions**; Route Handlers (`route.ts`) solo para APIs consumidas externamente, webhooks o el handler de Auth.js.
- Obtener datos en el servidor (Server Components / Server Actions); nunca exponer PrismaClient ni secretos al cliente.
- Next.js 16+: el archivo de interceptación es `proxy.ts` (reemplaza a `middleware.ts`). En versiones anteriores usar `middleware.ts`.
- El proxy es una capa optimista (redirecciones, refresco de sesión). La autorización real se verifica siempre en el servidor, junto al dato (página, Server Action o Route Handler).
- Usar `next/image`, `next/font` y `next/link` en lugar de sus equivalentes HTML.
- Manejar estados con `loading.tsx`, `error.tsx` y `not-found.tsx` por segmento cuando aplique.
- Metadata vía `export const metadata` / `generateMetadata`.
