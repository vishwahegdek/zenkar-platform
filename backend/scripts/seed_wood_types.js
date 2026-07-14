const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WOODS = [
  { id: 'acacia', name: 'Acacia', price: 1500, isSeeded: true },
  { id: 'halasu', name: 'Halasu', price: 3500, isSeeded: true },
  { id: 'bilakambi', name: 'Bilakambi', price: 2500, isSeeded: true },
  { id: 'honne', name: 'Honne', price: 3500, isSeeded: true },
  { id: 'teak', name: 'Teak', price: 6500, isSeeded: true },
  { id: 'kindal', name: 'Kindal', price: 1500, isSeeded: true },
];

async function main() {
  for (const wood of WOODS) {
    const exists = await prisma.woodType.findUnique({ where: { id: wood.id } });
    if (!exists) {
      await prisma.woodType.create({ data: wood });
    } else {
      await prisma.woodType.update({
        where: { id: wood.id },
        data: { name: wood.name, isSeeded: true } // Don't overwrite the price if it exists, user might have changed it
      });
    }
  }
  console.log("Wood types seeded.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
