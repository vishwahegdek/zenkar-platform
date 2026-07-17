const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const prisma = new PrismaClient();

async function main() {
  const defaultWoods = [
    { id: uuidv4(), name: 'Teak Wood', price: 4500, isSeeded: true },
    { id: uuidv4(), name: 'Halasu Wood', price: 2500, isSeeded: true },
    { id: uuidv4(), name: 'Kindal Wood', price: 1500, isSeeded: true },
    { id: uuidv4(), name: 'Neem Wood', price: 1200, isSeeded: true },
  ];

  for (const wood of defaultWoods) {
    await prisma.woodType.create({
      data: wood
    });
    console.log(`Created wood type: ${wood.name}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
