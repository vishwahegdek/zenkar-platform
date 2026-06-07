const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Deleting all Ledger Entries...');
  await prisma.ledgerEntry.deleteMany({});
  console.log('Deleting all Ledger Accounts...');
  await prisma.ledgerAccount.deleteMany({});
  console.log('Ledger has been completely reset.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
