const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.ledgerAccount.findMany({
    include: {
      entries: true
    }
  });

  const assets = accounts.filter(a => a.type === 'ASSET');
  console.log(`Found ${assets.length} ASSET accounts`);
  
  // What is returned by getBalanceSheet? It builds a tree.
  // In `BalanceInitializer.jsx`, it says:
  // accountsToInit.push(...(data.assets?.items || []));
}
main().catch(console.error).finally(() => prisma.$disconnect());
