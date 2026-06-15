const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, username: true } });
  console.log('Users:', users);
  
  const accounts = await prisma.ledgerAccount.findMany({
    where: { subType: { in: ['CASH', 'BANK'] } }
  });
  console.log('Treasury Accounts:', accounts);
}

main().finally(() => prisma.$disconnect());
