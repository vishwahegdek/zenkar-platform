
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list() {
  const labourers = await prisma.labourer.findMany({
      orderBy: { name: 'asc' }
  });
  console.log(`Total: ${labourers.length}`);
  labourers.forEach(l => {
      console.log(`[${l.id}] "${l.name}"`);
  });
  await prisma.$disconnect();
}

list();
