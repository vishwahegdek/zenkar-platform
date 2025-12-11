
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.customer.count();
  console.log(`Total customers in DB: ${count}`);
  
  const users = await prisma.user.findMany({ include: { _count: { select: { customers: true } } } });
  console.log('Customers per user:', users);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
