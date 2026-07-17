const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const woodTypes = await prisma.woodType.findMany();
  console.log(woodTypes);
}

main().catch(console.error).finally(() => prisma.$disconnect());
