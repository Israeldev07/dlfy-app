# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Dfly-app — Reglas principales del proyecto

@AGENTS.md

## Estado actual

App de delivery para **Otavalo (Ecuador)**: USD en centavos, celulares +593. Categorías: Restaurantes, Market, Farmacia, Licores y Mascotas. Flujo de pedidos: cliente → WhatsApp del dueño (datos completos) → comercio (solo productos, botones Aceptar/Rechazar) → confirmación al dueño y al cliente. Vía WhatsApp Cloud API con patrón outbox. Contexto de producto en `PRODUCT.md`; diseño de referencia en `Dfly Home v2.dc.html`.

Hecho: scaffold Next 16 + Prisma 7 + Auth.js v5, home, login, registro y catálogo (`/comercios`, `/comercios/[slug]`). Pendiente: carrito, checkout, mensajería WhatsApp y backoffice.

## Comandos

| Tarea | Comando |
|---|---|
| Desarrollo | `npm run dev` |
| Build | `npm run build` |
| Lint / tipos | `npm run lint` · `npm run typecheck` |
| Tests (Vitest) | `npm test` |
| Generar cliente Prisma | `npm run db:generate` (requiere `DIRECT_URL` en `.env`) |
| Nueva migración (local) | `npm run db:migrate -- --name <nombre>` |
| Migraciones (producción) | `npm run db:deploy` |
| Seed | `npm run db:seed` |

Notas: el cliente Prisma se genera en `src/generated/prisma` (ignorado por git) y se importa desde `@/generated/prisma/client`. npm 12 bloquea los scripts de instalación, por eso se usa `bcryptjs`. `src/proxy.ts` debe exportar la función por defecto (no sirve una exportación desestructurada).

## Configuración de Claude en el repo

- `.claude/rules/` — reglas detalladas por capa (`nextjs.md`, `database.md`, `auth.md`); son normativas y amplían este archivo.
- `.claude/agents/frontend-builder.md` — subagente para trabajo de UI (páginas, componentes, diseño, animación). Solo usa las skills del proyecto: `impeccable`, `design-taste-frontend` y `animacion`.
- `.claude/skills/` — skills de diseño instaladas desde GitHub (versiones fijadas en `skills-lock.json`); no editarlas a mano.

Estas reglas definen el stack base. Toda decisión técnica nueva debe respetarlas; si algo requiere desviarse, se propone y se justifica antes de implementarlo.

## Stack obligatorio

| Capa | Tecnología | Detalle |
|---|---|---|
| Framework | **Next.js** (App Router) + TypeScript | Ver `.claude/rules/nextjs.md` |
| Base de datos | **PostgreSQL** | Acceso vía Prisma ORM. Ver `.claude/rules/database.md` |
| Autenticación | **Auth.js (NextAuth.js v5)** | Login dual: credenciales + OAuth. Ver `.claude/rules/auth.md` |

## Principios generales

- TypeScript en modo `strict`. Nada de `any` salvo justificación explícita.
- Server Components por defecto; `"use client"` solo cuando haga falta interactividad.
- Toda entrada de usuario (formularios, Server Actions, Route Handlers) se valida con **Zod** en el servidor.
- Secretos únicamente en variables de entorno (`.env.local`, nunca commiteado). Mantener `.env.example` actualizado.
- Alias de imports: `@/` apunta a la raíz de `src/`.
- Antes de usar APIs de Next.js, Prisma o Auth.js, consultar la documentación actual (Context7): cambian entre versiones.

## Estructura base

```
src/
  app/                      # Rutas (App Router)
    api/auth/[...nextauth]/route.ts
    (auth)/login/           # Páginas públicas de autenticación
    (protected)/            # Rutas que requieren sesión
  components/
  lib/
    db.ts                   # Singleton de PrismaClient
    validations/            # Esquemas Zod
  auth.config.ts            # Config de Auth.js sin adapter (compatible con proxy)
  auth.ts                   # Instancia completa de Auth.js con Prisma adapter
  proxy.ts                  # Proxy (antes middleware.ts en Next < 16)
prisma/
  schema.prisma
  migrations/
```
