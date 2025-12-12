
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.labourer.count();
  console.log(`Labourers in DB: ${count}`);
  const expenses = await prisma.expense.count();
  console.log(`Expenses in DB: ${expenses}`);
  await prisma.$disconnect();
}

check();
