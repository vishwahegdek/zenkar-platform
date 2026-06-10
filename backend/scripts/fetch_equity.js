const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const account = await prisma.ledgerAccount.findFirst({
    where: { name: 'Opening Balance Equity' }
  });
  console.log('Account found:', account);
}
main().catch(console.error).finally(() => prisma.$disconnect());
