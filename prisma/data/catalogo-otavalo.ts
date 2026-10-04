// Catálogo real de Otavalo, tomado del catálogo de WhatsApp Business de Dfly (2026-10-03).
// Precios en centavos de USD. Se excluyen las promociones temporales ("Promoción del BURGUÉ")
// y los productos sin precio (p. ej. "Tilapia con patacón y arroz").
// Lo importa `npm run db:import-catalog` (prisma/import-catalog.ts).

export type CatalogProduct = { name: string; description?: string; priceCents: number };

export type CatalogStore = {
  slug: string;
  name: string;
  description?: string;
  /** E.164. Obligatorio: ahí le llegan los pedidos con Aceptar/Rechazar. */
  whatsappPhone: string;
  products: CatalogProduct[];
};

export type PendingStore = Pick<CatalogStore, "slug" | "name" | "description">;

/** Comercios con menú y WhatsApp: reciben pedidos. */
export const storesWithMenu: CatalogStore[] = [
  {
    slug: "alitas-terra-nova",
    name: "Alitas Terra Nova",
    description: "Alitas, hamburguesas, brochetas y combos para compartir.",
    whatsappPhone: "+593981012247",
    products: [
      { name: "Promo Alitas (20 x 40)", description: "4 salsas a elección + porción de papas", priceCents: 2400 },
      { name: "Promo Alitas (6 x 12)", description: "2 salsas a elección + porción de papas", priceCents: 800 },
      { name: "Promo Alitas (8 x 16)", description: "2 salsas a elección + porción de papas", priceCents: 1100 },
      { name: "Promo Alitas (12 x 24)", description: "3 salsas a elección + porción de alitas", priceCents: 1525 },
      { name: "Wrap de pollo", description: "Crujiente pollo o jugoso", priceCents: 450 },
      { name: "Hamburguesa de camarón", description: "Papas + camarón grill + tocino", priceCents: 500 },
      { name: "En pareja es mejor", description: "8 alitas + 2 hamburguesas + papas + bebidas", priceCents: 1200 },
      { name: "Hamburguesa (2 x 1)", description: "Dos hamburguesas + porción de papas", priceCents: 625 },
      { name: "Quesadillas gringa", description: "Tortillas de trigo + queso fundido con cerdo adobado", priceCents: 400 },
      { name: "Compartir Siempre", description: "16 alitas + 4 hamburguesas + papas + bebida + 2 salsas a elección", priceCents: 2050 },
      { name: "Hamburguesa de pizza", description: "Porción de papas + pepperoni + 150 g de carne", priceCents: 550 },
      { name: "Hamburguesa BBQ", description: "150 g de carne + salsa BBQ + papas", priceCents: 550 },
      { name: "Combo Terra Nova", description: "4 alitas + brocheta de pollo + hamburguesa + bebida", priceCents: 1400 },
      { name: "Combo Amigos", description: "6 alitas + 3 hamburguesas + papas + cerveza o cola", priceCents: 1400 },
      { name: "Brocheta mixta", description: "3 tipos de carne y verduras con su respectivo sabor original", priceCents: 700 },
      { name: "Hamburguesa doble", description: "Porción de papas + 2 carnes de 150 g", priceCents: 600 },
      { name: "Hamburguesa de chorizo", description: "Papas + 150 g de carne + chorizo", priceCents: 550 },
      { name: "Combo personal", description: "4 alitas + hamburguesa + papas + bebida", priceCents: 725 },
      { name: "Hamburguesa clásica", description: "150 g de carne + porción de papas", priceCents: 350 },
      { name: "Hamburguesa de pollo", description: "Papas + pollo crispy", priceCents: 450 },
      {
        name: "Nachos Mex",
        description: "(Tinta, pollo o mixto) Crujientes nachos con frijoles refritos y elección de carne, guacamole o pollo de galo",
        priceCents: 550,
      },
      { name: "Hamburguesa hawaiana", description: "Porción de papas + carne + piña + tocino", priceCents: 500 },
      { name: "Brocheta de pollo", description: "Pechuga de pollo adobada con mezcla de verduras", priceCents: 625 },
    ],
  },
  {
    slug: "el-burgue",
    name: "El Burgué",
    description: "Hamburguesas artesanales, smash y combos.",
    whatsappPhone: "+593962742502",
    products: [
      { name: "Hamburguesa Fogone", description: "Carne de res ahumada + queso cheddar + aros de cebolla caramelizada + salsa BBQ + tomate", priceCents: 400 },
      { name: "Combo 1", description: "2 hamburguesas tradicionales + 6 alitas BBQ + 1 porción de papas + 2 gaseosas de 250 ml", priceCents: 1075 },
      { name: "Combo 2", description: "2 hamburguesas BBQ + 2 presas de pollo + 1 porción de papas + 2 gaseosas de 250 ml", priceCents: 1100 },
      { name: "Combo 3", description: "2 hamburguesas crispy + 6 nuggets + 1 porción de papas + 2 gaseosas de 250 ml", priceCents: 1000 },
      { name: "Combo 4 Fogone", description: "2 hamburguesas Fogone + 1 picadita jr + 2 gaseosas de 250 ml", priceCents: 1075 },
      { name: "Combo 5", description: "3 hamburguesas tradicionales + 1 picadita + 3 gaseosas de 250 ml", priceCents: 1600 },
      { name: "Hamburguesa Crispy Burger", description: "Pollo crispy + queso cheddar + tomate + salsa dulce + aros de cebolla + lechuga", priceCents: 350 },
      { name: "Hamburguesa Bacon Smash", description: "Carne de cerdo + queso cheddar + tocino + salsa de tocineta + aros de cebolla caramelizada", priceCents: 500 },
      {
        name: "Hamburguesa Smash Burger",
        description: "300 g de carne + queso cheddar + salsa tártara + cebolla caramelizada + tocino crocante + salsa de la casa + pan de papa",
        priceCents: 450,
      },
      { name: "Deditos de jamón con queso", description: "5 unidades", priceCents: 600 },
      { name: "Hamburguesa tradicional", description: "Carne de res + queso cheddar + jamón + tomate + cebolla", priceCents: 300 },
      { name: "Ensalada Burgué", description: "Lechuga + pollo + cebolla + aceitunas + queso parmesano + tostadas + vinagreta", priceCents: 450 },
      { name: "Hamburguesa BBQ", description: "Carne de res en salsa BBQ + queso cheddar + tomate + cebolla + jamón", priceCents: 350 },
      { name: "Hamburguesa hawaiana", description: "Carne de res + queso cheddar + piña en almíbar + tomate + cebolla + tocino", priceCents: 400 },
      { name: "Hamburguesa Carnibal", description: "Albóndigas a la boloñesa + champiñones + queso cheddar + mozzarella + parmesano", priceCents: 500 },
      {
        name: "Hamburguesa Smash Birria",
        description: "100 g de carne de res + queso cheddar + 80 g de birria + pickles + pico de gallo + caldo de birria + pan de papa",
        priceCents: 575,
      },
      {
        name: "Nano Box",
        description: "6 mini hamburguesas tradicionales + papas + 2 salsas a elección (mayonesa, BBQ, tártara o de la casa)",
        priceCents: 750,
      },
      { name: "Hamburguesa Cheese Burger", description: "Carne de res rellena de queso + queso cheddar + mozzarella + pickles", priceCents: 500 },
      {
        name: "Hamburguesa completa",
        description: "Carne de res + queso cheddar + jamón + huevo + tocino + pepinillos agridulces + tomate + cebolla",
        priceCents: 500,
      },
      { name: "Chori Burguer", description: "Chorizo + carne de res + queso cheddar + chimichurri + tomate + cebolla", priceCents: 450 },
      {
        name: "Combo Familiar",
        description: "2 hamburguesas tradicionales + 2 hamburguesas BBQ + 1 picadita + 8 alitas BBQ + 1 gaseosa de 1,33 L",
        priceCents: 2200,
      },
      { name: "Combo Smash", description: "2 smash burgers de 150 g + 1 porción de papas + 2 milkshakes", priceCents: 1400 },
      { name: "Aros de cebolla", description: "6 unidades", priceCents: 450 },
    ],
  },
  {
    slug: "pouttin",
    name: "Pouttin",
    description: "Pouttin, alitas, nachos, waffles y bebidas.",
    whatsappPhone: "+593996605716",
    products: [
      { name: "Pouttin clásico", description: "Papas + jamón + pollo + guacamole + queso", priceCents: 150 },
      { name: "Pouttin Big", description: "Papas + jamón + queso + guacamole + pollo", priceCents: 200 },
      { name: "Pouttin Combo", description: "Papas + pollo + tocino + carne + queso + guacamole + bebida", priceCents: 350 },
      { name: "Pouttin @", description: "Papas + nachos + pollo + jamón + tocino + queso + guacamole", priceCents: 500 },
      { name: "Alitas", description: "Alitas + papas", priceCents: 400 },
      { name: "Combo 20 Alitas", description: "20 alitas + papas + cola de 1 L", priceCents: 1500 },
      { name: "Combo 1", description: "4 hamburguesas + 4 granizados", priceCents: 1000 },
      { name: "Combo 2", description: "Pouttin Big + alitas + nachos + Pouttin clásico + cola de 1 L", priceCents: 1000 },
      { name: "Combo Big", description: "Papas + tocino + queso cheddar", priceCents: 450 },
      { name: "Combo Nuggets", description: "Papas + nuggets + bebida", priceCents: 350 },
      { name: "Combo Wrap", description: "Papas + 2 wraps + bebida", priceCents: 450 },
      { name: "Hamburguesa Medium", description: "Hamburguesa simple + papas", priceCents: 250 },
      { name: "Bandeja Cheddar", description: "Papas + tocino + queso cheddar", priceCents: 350 },
      { name: "Cajita Poupuo", description: "Papas + nuggets + Kinder Joy + pulp", priceCents: 500 },
      { name: "Nachos con todo", description: "Pollo + carne + jamón + guacamole + queso", priceCents: 250 },
      { name: "Nachos con queso", description: "Nachos + guacamole + queso + cheddar", priceCents: 300 },
      { name: "Panqueques", description: "Miel + fresas + arándanos + plátanos", priceCents: 300 },
      { name: "Waffles", description: "Nutella + fresa + arándanos + plátanos + crema", priceCents: 300 },
      { name: "Yogurt Bubas", priceCents: 250 },
      { name: "Bubas", priceCents: 175 },
      { name: "Jugos", description: "Mora, guanábana o maracuyá", priceCents: 175 },
      { name: "Milk Shake", description: "Mora, guanábana o maracuyá", priceCents: 250 },
      { name: "Frappé de sabores", description: "Oreo, caramelo, Snickers o frappé Bubas", priceCents: 200 },
      { name: "Frappé", priceCents: 200 },
      { name: "Granizado pequeño", priceCents: 75 },
      { name: "Granizado mediano", priceCents: 100 },
      { name: "Granizado grande", priceCents: 175 },
    ],
  },
  {
    slug: "el-pollazo",
    name: "El Pollazo",
    description: "Pollo asado, papas y chaulafán.",
    whatsappPhone: "+593999536417",
    products: [
      { name: "Pollo entero", priceCents: 1500 },
      { name: "Medio pollo", priceCents: 800 },
      { name: "1/4 de pollo", priceCents: 400 },
      { name: "Octavo de pollo", priceCents: 300 },
      { name: "Papi pollo", priceCents: 300 },
      { name: "Papa completa", priceCents: 425 },
      { name: "Papa loca", priceCents: 400 },
      { name: "Papa mixta", priceCents: 325 },
      { name: "Chaulafán especial", priceCents: 500 },
      { name: "Camarón apanado", priceCents: 600 },
      { name: "Hamburguesa", priceCents: 375 },
    ],
  },
  {
    slug: "tacos-jalapeno",
    name: "Tacos Jalapeño",
    description: "Tacos, burritos, flautas y quesadillas.",
    whatsappPhone: "+593999816838",
    products: [
      { name: "Taco", priceCents: 250 },
      { name: "Flauta", priceCents: 475 },
      { name: "Burrito", priceCents: 475 },
      { name: "Quesadilla", priceCents: 375 },
      { name: "Nachos Jalapeño", priceCents: 375 },
      { name: "Alambre", priceCents: 375 },
      { name: "Alambre Estrella", priceCents: 375 },
    ],
  },
  {
    slug: "tilapias-antojitos",
    name: "Tilapias Antojitos",
    description: "Tilapia frita con patacón, yuca o papas.",
    whatsappPhone: "+593991317939",
    products: [
      { name: "Tilapia con patacón", description: "Tilapia + patacón + ensalada + tostado", priceCents: 400 },
      { name: "Tilapia con yuca", description: "Tilapia + yuca + ensalada + tostado", priceCents: 400 },
      { name: "Tilapia con yuca y arroz", description: "Tilapia + yuca + ensalada + tostado + arroz", priceCents: 400 },
      { name: "Tilapia con papas", description: "Tilapia + papa cocinada + ensalada + tostado", priceCents: 400 },
      { name: "Tilapia con papas y arroz", description: "Tilapia + papa cocinada + ensalada + tostado + arroz", priceCents: 400 },
      { name: "Porción de arroz", priceCents: 150 },
      { name: "Porción de patacón", priceCents: 150 },
      { name: "Porción de papas", description: "Papas cocinadas", priceCents: 150 },
    ],
  },
];

/**
 * Restaurantes del directorio del catálogo (colecciones "COMIDA CHINA" y "ALITAS"), PENDIENTES:
 * no se importan hasta tener su WhatsApp (y su menú). Al tenerlos, pasarlos a `storesWithMenu`.
 * Se omiten duplicados del directorio: "Terra Nova" (es Alitas Terra Nova) y "Gran buffalo alitas" (es El Gran Buffalo).
 */
export const pendingStores: PendingStore[] = [
  { slug: "casa-de-korea", name: "Casa de Korea", description: "Comida coreana" },
  { slug: "chifa-china", name: "Chifa China", description: "Comida china" },
  { slug: "chifa-inter", name: "Chifa Inter", description: "Comida china" },
  { slug: "chifa-inter-2", name: "Chifa Inter 2", description: "Comida china" },
  { slug: "chifa-excelencia", name: "Chifa Excelencia", description: "Comida china" },
  { slug: "chifa-canton", name: "Chifa Cantón", description: "Comida china" },
  { slug: "tai-jing", name: "Tai Jing", description: "Comida china" },
  { slug: "chifa-sol-y-luna", name: "Chifa Sol y Luna", description: "Comida china" },
  { slug: "chifa-imbabura", name: "Chifa Imbabura", description: "Comida china" },
  { slug: "chifa-lucy", name: "Chifa Lucy", description: "Comida china" },
  { slug: "la-estacion", name: "La Estación", description: "Comida coreana" },
  { slug: "la-catrina-otavalo", name: "La Catrina Otavalo" },
  { slug: "a-la-buena", name: "A La Buena", description: "Alitas" },
  { slug: "alitas-del-abuelo", name: "Alitas del Abuelo", description: "Alitas" },
  { slug: "social-garden-la-gampa", name: "Social Garden La Gampa" },
  { slug: "la-clasica-beer-garden", name: "La Clásica Beer Garden", description: "Alitas" },
  { slug: "victorina-garden-house", name: "Victorina Garden House", description: "Variedad de comida" },
  { slug: "afrodita-food-y-drink", name: "Afrodita Food y Drink" },
  { slug: "alitas-chispoteadas", name: "Alitas Chispoteadas", description: "Comida rápida" },
  { slug: "el-gran-buffalo", name: "El Gran Buffalo", description: "Alitas" },
  { slug: "goloso", name: "Goloso", description: "Alitas" },
  { slug: "knelos", name: "K'nelos", description: "Steak y grill" },
  { slug: "alitas-xcaanda", name: "Alitas Xcaanda", description: "El mejor sabor de alitas" },
];
