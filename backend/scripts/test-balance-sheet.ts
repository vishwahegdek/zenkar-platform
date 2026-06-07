import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBalanceSheet() {
  const asOfDate = new Date();

  const accounts = await prisma.ledgerAccount.findMany({
    include: {
      entries: {
        where: {
          date: { lte: asOfDate }
        }
      }
    }
  });

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  let totalRevenue = 0;
  let totalExpenses = 0;

  const assets: any[] = [];
  const liabilities: any[] = [];
  const equity: any[] = [];

  accounts.forEach(acc => {
    let debitSum = 0;
    let creditSum = 0;

    acc.entries.forEach(e => {
      debitSum += Number(e.debit);
      creditSum += Number(e.credit);
    });

    if (debitSum === 0 && creditSum === 0) return;

    let balance = 0;
    if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
      balance = debitSum - creditSum;
    } else {
      balance = creditSum - debitSum;
    }

    if (balance === 0) return;

    const item = {
      id: acc.id,
      name: acc.name,
      subType: acc.subType,
      balance,
      debitSum,
      creditSum
    };

    switch (acc.type) {
      case 'ASSET':
        assets.push(item);
        totalAssets += balance;
        break;
      case 'LIABILITY':
        liabilities.push(item);
        totalLiabilities += balance;
        break;
      case 'EQUITY':
        equity.push(item);
        totalEquity += balance;
        break;
      case 'REVENUE':
        totalRevenue += balance;
        break;
      case 'EXPENSE':
        totalExpenses += balance;
        break;
    }
  });

  const netIncome = totalRevenue - totalExpenses;
  totalEquity += netIncome;

  console.log(JSON.stringify({
    assets: {
      items: assets.sort((a, b) => b.balance - a.balance),
      total: totalAssets
    },
    liabilities: {
      items: liabilities.sort((a, b) => b.balance - a.balance),
      total: totalLiabilities
    },
    equity: {
      items: equity.sort((a, b) => b.balance - a.balance),
      netIncome,
      total: totalEquity
    },
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    totals: {
      totalRevenue,
      totalExpenses
    }
  }, null, 2));

  await prisma.$disconnect();
}

testBalanceSheet().catch(console.error);
