const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const labourers = await prisma.labourer.findMany({
    include: {
      attendance: {
        orderBy: { date: 'asc' },
        take: 1
      },
      settlements: {
        orderBy: { settlementDate: 'asc' },
        take: 1
      }
    }
  });

  for (const l of labourers) {
    console.log(`\nLabourer: ${l.name} (ID: ${l.id})`);
    
    if (l.attendance.length > 0) {
      const entry = l.attendance[0];
      console.log(`  First Attendance: Date: ${entry.date.toISOString().split('T')[0]}, Value: ${entry.value}`);
    } else {
      console.log(`  First Attendance: None`);
    }

    if (l.settlements.length > 0) {
      const set = l.settlements[0];
      console.log(`  First Settlement: Date: ${set.settlementDate.toISOString().split('T')[0]}, Total Payable: ${set.totalPayable}, Net Balance: ${set.netBalance}, Note: ${set.note || 'N/A'}`);
    } else {
      console.log(`  First Settlement: None`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
