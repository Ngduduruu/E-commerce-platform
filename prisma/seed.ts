import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const products = [
  { slug: "canvas-tote", name: "Canvas Tote", description: "Heavyweight 16oz cotton canvas tote with an interior pocket.", priceCents: 2800, stock: 40 },
  { slug: "ceramic-mug", name: "Ceramic Mug", description: "Stoneware mug, 350ml, glazed in matte charcoal. Dishwasher safe.", priceCents: 1800, stock: 60 },
  { slug: "linen-apron", name: "Linen Apron", description: "Stonewashed linen apron with adjustable neck strap.", priceCents: 4200, stock: 25 },
  { slug: "notebook-a5", name: "A5 Dot Notebook", description: "192 pages of 100gsm dot-grid paper, lay-flat binding.", priceCents: 1600, stock: 100 },
  { slug: "wool-beanie", name: "Merino Beanie", description: "Rib-knit merino wool beanie, one size.", priceCents: 3400, stock: 30 },
  { slug: "brass-pen", name: "Brass Pen", description: "Solid brass rollerball that patinas with use.", priceCents: 5500, stock: 15 },
];

async function main() {
  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: p, create: p });
  }
  console.log(`Seeded ${products.length} products`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
