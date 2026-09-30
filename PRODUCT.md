# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Residentes de **Otavalo (Imbabura, Ecuador)** que piden a domicilio en cinco categorías: **Restaurantes, Market, Farmacia, Licores y Mascotas** (no hay encomiendas). Usan el **celular y la computadora por igual** (confirmado), así que ninguna de las dos experiencias es secundaria.

Audiencias secundarias:
- **Dueño/operador de Dfly:** recibe cada pedido completo por WhatsApp y lo supervisa en el panel admin.
- **Comercios (restaurantes, markets, farmacias, licorerías, tiendas de mascotas):** no usan la web; reciben el pedido por WhatsApp y lo aceptan o rechazan con un botón.

## Product Purpose

Dfly deja al cliente pedir a los comercios de su zona desde una sola web. Cada pedido pasa por Dfly, que actúa de intermediario: el comercio recibe solo los productos y **nunca los datos de contacto del cliente**. El pedido tiene éxito cuando el comercio lo acepta y el cliente recibe la confirmación por WhatsApp y en la web.

## Positioning

*(Inferido; pendiente de confirmar.)* Un servicio local de Otavalo que reúne varias categorías en un solo lugar ("todo lo que necesitas, en una sola ruta"). Una persona de Dfly respalda cada pedido y la privacidad del cliente queda protegida frente al comercio.

## Operating Context

- Flujo: registro o login → catálogo de comercios → productos y carrito → checkout (dirección y celular) → estado del pedido en vivo.
- Todas las notificaciones van por la WhatsApp Cloud API: al dueño (pedido completo), al comercio (solo productos, con botones Aceptar/Rechazar) y al cliente (resultado).
- Un comercio por pedido en el MVP. Pago contra entrega (efectivo o transferencia).

## Capabilities and Constraints

- Stack: Next.js 16 (App Router) + PostgreSQL/Prisma 7 + Auth.js v5 (credenciales + Google).
- Moneda **USD**; celulares de Ecuador (+593).
- Dirección como texto (sector y referencia); sin mapa ni geolocalización en el MVP.
- Header: solo el logo, "Mi perfil" y los accesos Iniciar sesión / Registrarse. **Sin selector de dirección "Enviar a"** en el header (decisión del usuario).
- Sin decidir: pagos online, repartidores propios, onboarding de comercios.

## Brand Commitments

- Nombre: **Dfly**.
- Paleta confirmada por el usuario: fondo `#F2F2F2`, texto `#262626`, acentos cian `#04B2D9` y `#049DD9`, icono de tienda `#035AA6`, rojo de enlaces y marca `#EB0547` y `#B80339`.
- Tipografía confirmada: **Archivo** y **Archivo Black** (el diseño usa además JetBrains Mono en etiquetas).
- Diseño de referencia: `Dfly Home v2.dc.html`.
- Voz: español neutro de Ecuador, cercano y directo ("Todo lo que necesitas, en una sola ruta").

## Evidence on Hand

- `Dfly Home v2.dc.html`: diseño del home.
- La foto del hero (repartidor en moto al atardecer) está referenciada pero **no está en el repo**.
- No hay testimonios, métricas, logos de comercios ni precios reales. Los comercios del seed son ficticios. **No inventar pruebas sociales.**

## Product Principles

1. **La privacidad del cliente no se negocia:** ningún dato de contacto llega al comercio.
2. **Pedir rápido en cualquier pantalla:** celular y escritorio tienen el mismo cuidado.
3. **Siempre saber en qué va el pedido:** el estado es visible y se confirma por WhatsApp.
4. **Local primero:** comercios y lenguaje de Otavalo, no de una app genérica.

## Accessibility & Inclusion

Contraste WCAG AA como mínimo, objetivos táctiles de 44 px o más y formularios claros para usuarios poco habituados a apps de delivery.
