const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Rename Main Cash Book -> Cash Treasury (Global)
  await prisma.ledgerAccount.update({
    where: { id: 1 },
    data: { name: 'Cash Treasury', userId: null }
  });
  console.log('Updated ID 1 to Cash Treasury');

  // 2. Rename existing Bank Account (ID 317) to Vishwa Bank Account
  await prisma.ledgerAccount.update({
    where: { id: 317 },
    data: { name: 'Vishwa Bank Account', userId: 3 }
  });
  console.log('Updated ID 317 to Vishwa Bank Account (User 3)');

  // 3. Create Ganapati Bank Account
  // Check if it already exists to be safe
  let ganapatiBank = await prisma.ledgerAccount.findFirst({
    where: { name: 'Ganapati Bank Account', subType: 'BANK', userId: 2 }
  });

  if (!ganapatiBank) {
    ganapatiBank = await prisma.ledgerAccount.create({
      data: {
        name: 'Ganapati Bank Account',
        type: 'ASSET',
        subType: 'BANK',
        userId: 2
      }
    });
    console.log('Created Ganapati Bank Account (User 2) with ID:', ganapatiBank.id);
  } else {
    console.log('Ganapati Bank Account already exists with ID:', ganapatiBank.id);
  }

  // 4. Print final state
  const accounts = await prisma.ledgerAccount.findMany({
    where: { subType: { in: ['CASH', 'BANK'] } }
  });
  console.log('\nFinal Treasury Accounts:');
  console.table(accounts.map(a => ({ ID: a.id, Name: a.name, Type: a.subType, UserID: a.userId })));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
