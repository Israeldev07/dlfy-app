# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Dfly-app — Reglas principales del proyecto

@AGENTS.md

## Estado actual

App de delivery para **Otavalo (Ecuador)**: USD en centavos, celulares +593. Categorías: Restaurantes, Market, Farmacia, Licores y Mascotas. Flujo de pedidos: cliente → WhatsApp del dueño (datos completos) → comercio (solo productos, botones Aceptar/Rechazar) → confirmación al dueño y al cliente. Vía WhatsApp Cloud API con patrón outbox. Contexto de producto en `PRODUCT.md`; diseño de referencia en `Dfly Home v2.dc.html`.

Hecho: auth, catálogo, carrito, checkout, pedidos con estado en vivo, perfil, y mensajería (builders, outbox con reintentos, webhook firmado, crons). Sin credenciales de Meta, los mensajes se registran en la consola del servidor (`[whatsapp:dev]`). Pendiente: backoffice (`/admin`) y catálogo real.

## Comandos

| Tarea | Comando |
|---|---|
| Desarrollo | `npm run dev` |
| Build | `npm run build` |
| Lint / tipos | `npm run lint` · `npm run typecheck` |
| Tests (Vitest) | `npm test` · un archivo: `npx vitest run src/modules/ordering/domain.test.ts` · por nombre: `npx vitest run -t "<texto>"` |
| Generar cliente Prisma | `npm run db:generate` (requiere `DIRECT_URL` en `.env`) |
| Nueva migración (local) | `npm run db:migrate -- --name <nombre>` |
| Migraciones (producción) | `npm run db:deploy` |
| Seed | `npm run db:seed` |
| Explorar datos | `npm run db:studio` |

Notas: el cliente Prisma (v7, `prisma-client` + `@prisma/adapter-pg`) se genera en `src/generated/prisma` (ignorado por git) y se importa desde `@/generated/prisma/client`; los enums desde `@/generated/prisma/enums`. La app conecta con `DATABASE_URL` (puede ir por pooler); el CLI (`prisma.config.ts`) usa `DIRECT_URL`. Los tests son unitarios puros (`src/**/*.test.ts`), sin base de datos. npm 12 bloquea los scripts de instalación, por eso se usa `bcryptjs`. `src/proxy.ts` debe exportar la función por defecto (no sirve una exportación desestructurada).

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
- Secretos únicamente en variables de entorno (`.env`, ignorado por git; Prisma lo lee vía `dotenv`). Mantener `.env.example` actualizado.
- Alias de imports: `@/` apunta a la raíz de `src/`.
- Antes de usar APIs de Next.js, Prisma o Auth.js, consultar la documentación actual (Context7): cambian entre versiones.

## Arquitectura

La lógica de negocio vive en `src/modules/<dominio>/` (`identity`, `catalog`, `ordering`, `messaging`); `src/app` solo compone páginas y Route Handlers. Los archivos de servidor llevan `import "server-only"`; `domain.ts` y los builders de mensajes son puros para poder testearlos.

**Ciclo de un pedido** (`OrderStatus`: `PENDING → SENT_TO_STORE → ACCEPTED | REJECTED | EXPIRED`, más `CANCELLED`):
1. `ordering/actions.ts#createOrderAction` valida con Zod, **recalcula precios desde la BD** y, en una sola transacción, crea el pedido y encola dos mensajes: `ADMIN_NEW_ORDER` (datos completos al dueño) y `STORE_REQUEST` (solo productos y notas saneadas al comercio; nunca datos del cliente). Luego dispara el envío con `after()`.
2. `messaging/outbox.ts#dispatchOutbox` envía lo pendiente con reserva optimista (`attempts` como versión), backoff exponencial y máx. 5 intentos. Al enviarse `STORE_REQUEST`, el pedido pasa a `SENT_TO_STORE`. Es seguro correrlo en paralelo (`after()` + cron).
3. Los botones del comercio llevan un payload firmado con HMAC (`messaging/action-payload.ts`, `ORDER_ACTION_SECRET`). El webhook (`api/webhooks/whatsapp`) verifica la firma de Meta, deduplica por `WebhookEvent.waMessageId` y llama a `ordering/store-response.ts#applyStoreResponse`, que exige que el remitente sea el número del comercio.
4. Crons (`api/cron/outbox`, `api/cron/expire-orders`, autenticados con `Bearer CRON_SECRET` vía `lib/cron-auth.ts`): reintentos del outbox y expiración de pedidos sin respuesta tras `ORDER_RESPONSE_TIMEOUT_MIN`.

Invariantes:
- Todo cambio de estado pasa por `ordering/transitions.ts#transitionOrder`: valida contra la tabla de `domain.ts`, hace `updateMany` condicionado al estado actual (gana la primera respuesta) y registra un `OrderStatusEvent`.
- Todo mensaje saliente se encola con `enqueue(tx, ...)` **dentro de la misma transacción** que el cambio de estado; nunca se llama al transporte directamente.
- `Store.whatsappPhone` y los datos del cliente (`customerName/Phone`, `deliveryAddress`, snapshot en `Order`) nunca llegan al comercio ni al navegador ajeno.
- `messaging/transport.ts` usa la Cloud API si hay credenciales; si no, `DevLogTransport`. Los mensajes son plantillas de Meta (`template` + `bodyParams` + `quickReplies`).

**Carrito**: estado cliente con Zustand persistido (`ordering/cart-store.ts`), un solo comercio por carrito; en el checkout los precios del cliente se ignoran.

**Rate limiting**: ventana fija en Postgres (`RateLimitBucket`, upsert atómico en `lib/rate-limit.ts`; límites en `lib/rate-limit-rules.ts`). Login por IP y por email dentro de `authorize()` (cubre también el endpoint de Auth.js); al superarlo, el bloqueo dura 15 min completos desde ese momento (`blockSec`), registro por IP y pedidos por usuario. El cron `expire-orders` borra las ventanas vencidas.

**Auth**: además de `.claude/rules/auth.md`, las páginas protegidas usan `identity/session.ts#requireUser(returnTo)`; el matcher de `proxy.ts` excluye `/api`, así que cada Route Handler se protege solo.
