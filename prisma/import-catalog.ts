import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, StoreCategory } from "../src/generated/prisma/client";
import { pendingStores, storesWithMenu, type CatalogStore } from "./data/catalogo-otavalo";

// Importa el catálogo real (prisma/data/catalogo-otavalo.ts). Se puede correr varias veces:
// - Comercio por slug: actualiza nombre, descripción y WhatsApp.
//   No toca sector, tiempo de entrega, visibilidad ni imagen: eso se ajusta desde /admin.
// - Producto por nombre dentro del comercio: actualiza precio y descripción, crea los nuevos.
//   Nunca borra: lo que se quite del catálogo se marca agotado a mano desde /admin.

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
});

const DEFAULTS = { category: StoreCategory.RESTAURANT, city: "Otavalo", sector: "Otavalo", etaMinutes: 30 };

async function importStore(store: CatalogStore) {
  const { products, ...fields } = store;
  const saved = await prisma.store.upsert({
    where: { slug: store.slug },
    update: fields,
    create: { ...DEFAULTS, ...fields },
    select: { id: true },
  });

  const existing = await prisma.product.findMany({ where: { storeId: saved.id }, select: { id: true, name: true } });
  const byName = new Map(existing.map((p) => [p.name.toLowerCase(), p.id]));
  let created = 0;
  let updated = 0;
  for (const p of products) {
    const data = { name: p.name, description: p.description ?? null, priceCents: p.priceCents };
    const id = byName.get(p.name.toLowerCase());
    if (id) {
      await prisma.product.update({ where: { id }, data, select: { id: true } });
      updated++;
    } else {
      await prisma.product.create({ data: { ...data, storeId: saved.id }, select: { id: true } });
      created++;
    }
  }
  return { created, updated };
}

async function main() {
  for (const store of storesWithMenu) {
    const { created, updated } = await importStore(store);
    console.log(`${store.name}: ${created} productos nuevos, ${updated} actualizados`);
  }
  console.log(`Catálogo OK: ${storesWithMenu.length} comercios.`);
  console.log(`Pendientes de WhatsApp (no importados): ${pendingStores.map((s) => s.name).join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
