const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const accounts = await prisma.ledgerAccount.findMany({ where: { type: 'ASSET', subType: { in: ['CASH', 'BANK'] } } });
  console.log(accounts);
}
main().finally(() => prisma.$disconnect());
