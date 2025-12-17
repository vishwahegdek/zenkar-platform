
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  console.log('Connecting...');
  
  try {
      const labourers = await prisma.labourer.findMany({
          orderBy: { name: 'asc' },
          include: {
              settlements: {
                  orderBy: { settlementDate: 'desc' },
                  take: 1
              }
          }
      });
      console.log('Labourers found:', labourers.length);
      
      if (labourers.length > 0) {
          const l = labourers[0];
          console.log('First labourer:', l.name);
          console.log('Settlements:', JSON.stringify(l.settlements));
          console.log('Settlements is array?', Array.isArray(l.settlements));
          
          if (l.settlements && l.settlements.length > 0) {
             console.log('First Sett:', l.settlements[0].settlementDate);
          }
      }
      
  } catch (e) {
      console.error('ERROR:', e);
  } finally {
      await prisma.$disconnect();
  }
}

main();
