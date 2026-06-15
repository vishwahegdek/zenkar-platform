import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const accounts = await prisma.ledgerAccount.findMany({ where: { type: 'ASSET' } });
  console.log(accounts);
}
main().finally(() => prisma.$disconnect());
