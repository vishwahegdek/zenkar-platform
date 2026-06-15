const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cashAccount = await prisma.ledgerAccount.findFirst({ where: { subType: 'CASH' } });
  if (!cashAccount) { console.log('No cash account found'); return; }

  const entries = await prisma.ledgerEntry.findMany({
    where: { accountId: cashAccount.id }
  });

  const summary = {};
  let totalDebit = 0;
  let totalCredit = 0;

  for (const e of entries) {
    const type = e.sourceType;
    if (!summary[type]) summary[type] = { debitsIn: 0, creditsOut: 0 };
    summary[type].debitsIn += Number(e.debit);
    summary[type].creditsOut += Number(e.credit);
    totalDebit += Number(e.debit);
    totalCredit += Number(e.credit);
  }

  console.log(`Cash Account Analysis (ID: ${cashAccount.id})`);
  console.log('--------------------------------------------------');
  console.table(
    Object.keys(summary).map(type => ({
      Source: type,
      'Cash Received (Debit)': summary[type].debitsIn,
      'Cash Spent (Credit)': summary[type].creditsOut,
      'Net Cash Flow': summary[type].debitsIn - summary[type].creditsOut
    }))
  );
  console.log('--------------------------------------------------');
  console.log(`Total Cash Received: ${totalDebit}`);
  console.log(`Total Cash Spent:    ${totalCredit}`);
  console.log(`Final Cash Balance:  ${totalDebit - totalCredit}`);
}

main().finally(() => prisma.$disconnect());
