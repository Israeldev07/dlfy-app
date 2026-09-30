---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/(auth)/login/page.tsx"]
---

# Home + acceso (Dfly)

Scope: `/` (home), `/login`, `/registro`, cabecera global, `/comercios` (catálogo). Mode: Persuade (home) / Operate (acceso, catálogo).
Audience: vecinos de Otavalo, móvil y escritorio por igual. Acción: entrar y pedir.
Constraints: mundo visual heredado de `Dfly Home v2.dc.html` (extensión, sin ronda de conceptos). Cabecera: solo logo + "Mi perfil" (sin sesión despliega Iniciar sesión / Registrarse). Sin "Enviar a". Sin claims inventados.

## Direction contract
THESIS: Dfly es una ruta: rojo de marca como hilo conductor (regla inferior de 3px, logo) y cian como "vía libre" para cada acción. Categorías: Restaurantes, Market, Farmacia, Licores, Mascotas. Rechaza el marketplace genérico de tarjetas iguales con iconos.
OWN-WORLD: fondo #F2F2F2, tinta #262626, cian #04B2D9/#049DD9 solo en acciones, rojo #EB0547/#B80339 en marca y enlaces, azul #035AA6 para el pictograma de tienda. Archivo Black para titulares compactos (-0.03em), Archivo para todo lo demás. Radios 8px en controles, 14px en superficies.
STORY: el visitante entiende en una línea que todo Otavalo llega en una sola ruta, elige categoría o entra a ver comercios, y crea cuenta en menos de un minuto.
FIRST VIEWPORT: hero oscuro a sangre con foto del repartidor (o campo #262626 hasta que exista), titular de 3 líneas en Archivo Black a la izquierda, "ruta" en cian, CTA cian "Ver comercios" y chips de categorías debajo.
FORM: extensión del mundo incumbente (sin seed; request precisamente especificado).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
