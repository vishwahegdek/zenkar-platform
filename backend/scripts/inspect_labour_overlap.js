const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const manualLabourAcc = await prisma.ledgerAccount.findFirst({ where: { name: 'Expense Category: Labour' } });
  const automatedWageAcc = await prisma.ledgerAccount.findFirst({ where: { subType: 'WAGE_EXPENSE' } });

  console.log(`Manual Labour Acc ID: ${manualLabourAcc?.id}`);
  console.log(`Automated Wage Acc ID: ${automatedWageAcc?.id}`);
}

main().finally(() => prisma.$disconnect());
