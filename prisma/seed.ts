import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Clear existing products
  await prisma.product.deleteMany({});
  console.log("Cleared existing products");

  // Create test products using placeholder images
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Mobile Legends: Bang Bang",
        description: "Пополнение алмазов в Mobile Legends. Быстрое зачисление в течение 5-10 минут.",
        category: "GAME",
        gameType: "MOBILE_LEGENDS",
        image: "https://placehold.co/200x200/1a2444/fefcfb?text=ML",
        basePrice: 100,
        currentPrice: 90,
        discount: 10,
        sortOrder: 1,
      },
    }),
    prisma.product.create({
      data: {
        name: "PUBG Mobile UC",
        description: "Пополнение UC в PUBG Mobile. Официальное пополнение через наш сайт.",
        category: "GAME",
        gameType: "PUBG_MOBILE",
        image: "https://placehold.co/200x200/1a2444/fefcfb?text=PUBG",
        basePrice: 150,
        currentPrice: 125,
        discount: 17,
        sortOrder: 2,
      },
    }),
    prisma.product.create({
      data: {
        name: "Free Fire Алмазы",
        description: "Пополнение алмазов в Free Fire. Быстрое зачисление.",
        category: "GAME",
        gameType: "FREE_FIRE",
        image: "https://placehold.co/200x200/1a2444/fefcfb?text=FF",
        basePrice: 80,
        currentPrice: 80,
        discount: 0,
        sortOrder: 3,
      },
    }),
    prisma.product.create({
      data: {
        name: "Steam пополнение (СНГ)",
        description: "Пополнение Steam кошелька для аккаунтов из СНГ.",
        category: "SERVICE",
        gameType: "STEAM",
        image: "https://placehold.co/200x200/1a2444/fefcfb?text=Steam",
        basePrice: 200,
        currentPrice: 200,
        discount: 0,
        sortOrder: 4,
      },
    }),
  ]);

  console.log(`Created ${products.length} products`);

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
