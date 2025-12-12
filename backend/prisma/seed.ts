
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Seed script skipped in production environment to prevent data loss.');
    return;
  }

  const adminUsername = 'admin';
  const adminPassword = 'admin123'; // Change this in production!

  const existingUser = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingUser) {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await prisma.user.create({
      data: {
        username: adminUsername,
        password: passwordHash,
      },
    });
    console.log(`Created user: ${adminUsername}`);
  } else {
    console.log(`User ${adminUsername} already exists.`);
  }

  // Seed Expense Categories
  const categories = ['Labour', 'Material', 'Transport', 'Utilities', 'Other'];
  for (const cat of categories) {
    const exists = await prisma.expenseCategory.findUnique({ where: { name: cat } });
    if (!exists) {
      await prisma.expenseCategory.create({ data: { name: cat } });
      console.log(`Created category: ${cat}`);
    }
  }

  // --- NEW: Sample Test Data ---
  
  // 1. Customers
  const customers = [
    { name: 'John Doe', phone: '9876543210', address: '123 Main St' },
    { name: 'Jane Smith', phone: '9123456780', address: '456 Oak Ave' },
    { name: 'Bob Builder', phone: '9988776655', address: '789 Pine Rd' }
  ];

  for (const c of customers) {
      const exists = await prisma.customer.findFirst({ where: { name: c.name } });
      if (!exists) {
          await prisma.customer.create({
              data: { ...c, userId: existingUser?.id || 1 } // Assuming ID 1 if user just created
          });
          console.log(`Created customer: ${c.name}`);
      }
  }

  // 2. Products
  const products = [
      { name: 'Cement (Bag)', defaultUnitPrice: 450, notes: 'Ultratech' },
      { name: 'Steel Rod (kg)', defaultUnitPrice: 65, notes: 'TMT Bar' },
      { name: 'Bricks (pc)', defaultUnitPrice: 12, notes: 'Red Clay' },
      { name: 'Sand (cft)', defaultUnitPrice: 55, notes: 'River Sand' }
  ];

  for (const p of products) {
      const exists = await prisma.product.findFirst({ where: { name: p.name } });
      if (!exists) {
          await prisma.product.create({
              data: { ...p, createdById: existingUser?.id || 1 }
          });
          console.log(`Created product: ${p.name}`);
      }
  }

  // 3. Orders (Sample)
  const cust = await prisma.customer.findFirst();
  const prod = await prisma.product.findFirst();

  if (cust && prod) {
      const existingOrder = await prisma.order.findFirst({ where: { customerId: cust.id } });
      if (!existingOrder) {
          await prisma.order.create({
              data: {
                  customerId: cust.id,
                  orderDate: new Date(),
                  status: 'PENDING',
                  createdById: existingUser?.id || 1,
                  items: {
                      create: [
                          { productId: prod.id, quantity: 10, unitPrice: prod.defaultUnitPrice, lineTotal: Number(prod.defaultUnitPrice) * 10 }
                      ]
                  },
                  payments: {
                      create: [
                          { amount: 1000, date: new Date(), note: 'Advance', createdById: existingUser?.id || 1 }
                      ]
                  }
              }
          });
          console.log('Created sample order');
      }
  }

  }

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
