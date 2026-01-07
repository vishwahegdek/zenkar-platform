
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding categories...');

  // 1. Create Default Category if not exists
  let general = await prisma.productCategory.findUnique({
      where: { name: 'General' }
  });

  if (!general) {
      console.log('Creating "General" category...');
      general = await prisma.productCategory.create({
          data: { name: 'General' }
      });
  } else {
      console.log('Found "General" category:', general.id);
  }

  // 1.1 Create Bee Boxes Category
  let beeBoxes = await prisma.productCategory.findUnique({
      where: { name: 'Bee boxes' }
  });

  if (!beeBoxes) {
      console.log('Creating "Bee boxes" category...');
      beeBoxes = await prisma.productCategory.create({
          data: { name: 'Bee boxes' }
      });
  } else {
      console.log('Found "Bee boxes" category:', beeBoxes.id);
  }

  // 2. Update all products with null categoryId
  const result = await prisma.product.updateMany({
      where: { categoryId: null } as any,
      data: { categoryId: general.id }
  });

  console.log(`Updated ${result.count} products to use "General" category.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
