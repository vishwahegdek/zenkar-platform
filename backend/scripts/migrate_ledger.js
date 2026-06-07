const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Unified Ledger Historical Backfill Migration ---');

  try {
    // 1. Ensure System Accounts exist
    console.log('1. Initializing Core System Accounts...');
    const systemAccountsData = [
      { name: 'Main Cash Book', type: 'ASSET', subType: 'CASH' },
      { name: 'Sales Revenue', type: 'REVENUE', subType: 'SALES_REVENUE' },
      { name: 'Inventory Purchases', type: 'EXPENSE', subType: 'GENERAL_EXPENSE' },
      { name: 'Labour Wages', type: 'EXPENSE', subType: 'WAGE_EXPENSE' },
      { name: 'Opening Balance Equity', type: 'EQUITY', subType: 'EQUITY' },
    ];

    const systemAccounts = {};
    for (const sa of systemAccountsData) {
      let acc = await prisma.ledgerAccount.findFirst({
        where: { subType: sa.subType },
      });
      if (!acc) {
        acc = await prisma.ledgerAccount.create({
          data: sa,
        });
        console.log(`Created System Account: ${sa.name}`);
      } else {
        console.log(`System Account exists: ${sa.name}`);
      }
      systemAccounts[sa.subType] = acc;
    }

    // Lazy account creation caches
    const customerAccountMap = {};
    const contactAccountMap = {};
    const labourerAccountMap = {};

    async function getOrCreateCustomerAcc(customerId, customerName) {
      if (!customerId) return null;
      if (customerAccountMap[customerId]) return customerAccountMap[customerId];
      let acc = await prisma.ledgerAccount.findFirst({ where: { customerId } });
      if (!acc) {
        acc = await prisma.ledgerAccount.create({
          data: { name: `Customer: ${customerName}`, type: 'ASSET', subType: 'CUSTOMER', customerId }
        });
        console.log(`  Created account for Customer: ${customerName}`);
      }
      customerAccountMap[customerId] = acc;
      return acc;
    }

    async function getOrCreateSupplierAcc(supplierId, supplierName) {
      if (!supplierId) return null;
      if (contactAccountMap[supplierId]) return contactAccountMap[supplierId];
      let acc = await prisma.ledgerAccount.findFirst({ where: { supplierId } });
      if (!acc) {
        acc = await prisma.ledgerAccount.create({
          data: { name: `Supplier: ${supplierName}`, type: 'LIABILITY', subType: 'SUPPLIER', supplierId }
        });
        console.log(`  Created account for Supplier: ${supplierName}`);
      }
      contactAccountMap[supplierId] = acc;
      return acc;
    }

    async function getOrCreateLabourerAcc(labourerId, labourerName) {
      if (!labourerId) return null;
      if (labourerAccountMap[labourerId]) return labourerAccountMap[labourerId];
      let acc = await prisma.ledgerAccount.findFirst({ where: { labourerId } });
      if (!acc) {
        acc = await prisma.ledgerAccount.create({
          data: { name: `Labourer: ${labourerName}`, type: 'LIABILITY', subType: 'LABOURER', labourerId }
        });
        console.log(`  Created account for Labourer: ${labourerName}`);
      }
      labourerAccountMap[labourerId] = acc;
      return acc;
    }

    // 5. Clean start for entries to prevent duplicates if script runs twice
    // (User requested a wipe, but typically we'd just delete entries. We wiped via reset_ledger.js)
    console.log('\n2. Cleaning existing ledger entries...');
    const deletedCount = await prisma.ledgerEntry.deleteMany({});
    console.log(`  Deleted ${deletedCount.count} existing ledger entries.`);

    // 6. Migrate Orders
    console.log('\n3. Migrating Orders...');
    const orders = await prisma.order.findMany({
      where: { isDeleted: false },
      include: { customer: true },
    });
    for (const order of orders) {
      const customerAcc = await getOrCreateCustomerAcc(order.customerId, order.customer?.name || 'Unknown');
      if (!customerAcc) {
        console.warn(`  Warning: Customer account not found for Order #${order.id}, skipping order entry.`);
        continue;
      }
      if (['ENQUIRED', 'CANCELLED'].includes(order.status)) continue;
      const amount = Number(order.totalAmount) - Number(order.discount || 0);
      if (amount <= 0) continue;

      const transactionId = `ORDER-${order.id}`;

      // Debit Customer (Receivable asset increases)
      await prisma.ledgerEntry.create({
        data: {
          transactionId,
          accountId: customerAcc.id,
          date: order.orderDate,
          debit: amount,
          credit: 0,
          sourceType: 'ORDER',
          sourceId: order.id,
          note: `Order #${order.id} confirmed for ${order.customer?.name || 'Walk-In'}`,
        },
      });

      // Credit Sales Revenue (Revenue increases)
      await prisma.ledgerEntry.create({
        data: {
          transactionId,
          accountId: systemAccounts['SALES_REVENUE'].id,
          date: order.orderDate,
          debit: 0,
          credit: amount,
          sourceType: 'ORDER',
          sourceId: order.id,
          note: `Order #${order.id} confirmed for ${order.customer?.name || 'Walk-In'}`,
        },
      });
    }
    console.log(`  Successfully migrated ${orders.length} orders.`);

    // 7. Migrate Payments
    console.log('\n4. Migrating Payments...');
    const payments = await prisma.payment.findMany({
      include: { order: { include: { customer: true } } },
    });
    for (const p of payments) {
      const order = p.order;
      if (!order) continue;
      const customerAcc = await getOrCreateCustomerAcc(order.customerId, order.customer?.name || 'Unknown');
      if (!customerAcc) continue;

      const amount = Number(p.amount);
      if (amount <= 0) continue;

      const transactionId = `PAYMENT-${p.id}`;

      // Debit Cash (Asset increases)
      await prisma.ledgerEntry.create({
        data: {
          transactionId,
          accountId: systemAccounts['CASH'].id,
          date: p.date,
          debit: amount,
          credit: 0,
          sourceType: 'PAYMENT',
          sourceId: p.id,
          note: p.note || `Payment received for Order #${order.id}`,
        },
      });

      // Credit Customer (Asset decreases / receivable paid down)
      await prisma.ledgerEntry.create({
        data: {
          transactionId,
          accountId: customerAcc.id,
          date: p.date,
          debit: 0,
          credit: amount,
          sourceType: 'PAYMENT',
          sourceId: p.id,
          note: p.note || `Payment received for Order #${order.id}`,
        },
      });
    }
    console.log(`  Successfully migrated ${payments.length} payments.`);

    // 8. Migrate Purchases
    console.log('\n5. Migrating Purchases...');
    const purchases = await prisma.purchase.findMany({
      include: { supplier: true },
    });
    for (const pur of purchases) {
      if (!pur.supplierId) continue;
      const supplierAcc = await getOrCreateSupplierAcc(pur.supplierId, pur.supplier?.name || 'Unknown');
      if (!supplierAcc) continue;

      const amount = Number(pur.totalAmount);
      if (amount <= 0) continue;

      const transactionId = `PURCHASE-${pur.id}`;

      // Debit Inventory Purchases (Expense increases)
      await prisma.ledgerEntry.create({
        data: {
          transactionId,
          accountId: systemAccounts['GENERAL_EXPENSE'].id,
          date: pur.purchaseDate,
          debit: amount,
          credit: 0,
          sourceType: 'PURCHASE',
          sourceId: pur.id,
          note: pur.notes || `Purchase invoice #${pur.id} from supplier`,
        },
      });

      // Credit Supplier (Liability increases)
      await prisma.ledgerEntry.create({
        data: {
          transactionId,
          accountId: supplierAcc.id,
          date: pur.purchaseDate,
          debit: 0,
          credit: amount,
          sourceType: 'PURCHASE',
          sourceId: pur.id,
          note: pur.notes || `Purchase invoice #${pur.id} from supplier`,
        },
      });
    }
    console.log(`  Successfully migrated ${purchases.length} purchases.`);
    
    // Purchase Payments (NEW: We added PurchasePayment model in recent updates)
    console.log('\n6. Migrating Purchase Payments...');
    const purchasePayments = await prisma.purchasePayment.findMany({
      include: { purchase: { include: { supplier: true } } },
    });
    for (const pp of purchasePayments) {
      const purchase = pp.purchase;
      if (!purchase || !purchase.supplierId) continue;
      const supplierAcc = await getOrCreateSupplierAcc(purchase.supplierId, purchase.supplier?.name || 'Unknown');
      if (!supplierAcc) continue;

      const amount = Number(pp.amount);
      if (amount <= 0) continue;

      const transactionId = `PURCHASE-PAYMENT-${pp.id}`;

      // Debit Supplier (Liability decreases)
      await prisma.ledgerEntry.create({
        data: {
          transactionId,
          accountId: supplierAcc.id,
          date: pp.date,
          debit: amount,
          credit: 0,
          sourceType: 'PURCHASE_PAYMENT',
          sourceId: pp.id,
          note: pp.note || `Payment sent for Purchase #${purchase.id}`,
        },
      });

      // Credit Cash (Asset decreases)
      await prisma.ledgerEntry.create({
        data: {
          transactionId,
          accountId: systemAccounts['CASH'].id,
          date: pp.date,
          debit: 0,
          credit: amount,
          sourceType: 'PURCHASE_PAYMENT',
          sourceId: pp.id,
          note: pp.note || `Payment sent for Purchase #${purchase.id}`,
        },
      });
    }
    console.log(`  Successfully migrated ${purchasePayments.length} purchase payments.`);


    // 9. Migrate Expenses
    console.log('\n7. Migrating Expenses...');
    const expenses = await prisma.expense.findMany({
      include: {
        category: true,
      },
    });

    const categoryAccounts = {};

    for (const exp of expenses) {
      const amount = Number(exp.amount);
      if (amount <= 0) continue;

      const transactionId = `EXPENSE-${exp.id}`;

      // Map debit account to category
      const catName = exp.category.name;
      if (!categoryAccounts[catName]) {
        let acc = await prisma.ledgerAccount.findFirst({
          where: { name: `Expense Category: ${catName}` },
        });
        if (!acc) {
          acc = await prisma.ledgerAccount.create({
            data: {
              name: `Expense Category: ${catName}`,
              type: 'EXPENSE',
              subType: 'GENERAL_EXPENSE',
            },
          });
        }
        categoryAccounts[catName] = acc;
      }
      let debitAccountId = categoryAccounts[catName].id;

      // Debit Expense Account
      await prisma.ledgerEntry.create({
        data: {
          transactionId,
          accountId: debitAccountId,
          date: exp.date,
          debit: amount,
          credit: 0,
          sourceType: 'EXPENSE',
          sourceId: exp.id,
          note: exp.description || `Expense under ${exp.category.name}`,
        },
      });

      // Credit Cash Account
      await prisma.ledgerEntry.create({
        data: {
          transactionId,
          accountId: systemAccounts['CASH'].id,
          date: exp.date,
          debit: 0,
          credit: amount,
          sourceType: 'EXPENSE',
          sourceId: exp.id,
          note: exp.description || `Expense under ${exp.category.name}`,
        },
      });
    }
    console.log(`  Successfully migrated ${expenses.length} expenses.`);

    // 10. Migrate Settlements
    console.log('\n8. Migrating Labour Settlements...');
    const settlements = await prisma.labourSettlement.findMany({
      include: { labourer: true },
    });
    for (const set of settlements) {
      const labourerAcc = await getOrCreateLabourerAcc(set.labourerId, set.labourer?.name || 'Unknown');
      if (!labourerAcc) continue;

      const transactionId = `SETTLEMENT-${set.id}`;

      // Step 1: Recognize accrued wages
      const payable = Number(set.totalPayable);
      if (payable > 0) {
        // Debit Wage Expense
        await prisma.ledgerEntry.create({
          data: {
            transactionId,
            accountId: systemAccounts['WAGE_EXPENSE'].id,
            date: set.settlementDate,
            debit: payable,
            credit: 0,
            sourceType: 'LABOUR_SETTLEMENT',
            sourceId: set.id,
            note: `Wage Expense accrued for labourer up to ${set.settlementDate.toISOString().split('T')[0]}`,
          },
        });

        // Credit Labourer (Liability increases)
        await prisma.ledgerEntry.create({
          data: {
            transactionId,
            accountId: labourerAcc.id,
            date: set.settlementDate,
            debit: 0,
            credit: payable,
            sourceType: 'LABOUR_SETTLEMENT',
            sourceId: set.id,
            note: `Wage Expense accrued for labourer up to ${set.settlementDate.toISOString().split('T')[0]}`,
          },
        });
      }

      // Step 2: Recognize payment made during settlement
      const paid = Number(set.totalPaid);
      if (paid > 0) {
        // Debit Labourer (Liability decreases)
        await prisma.ledgerEntry.create({
          data: {
            transactionId: `${transactionId}-PAYMENT`,
            accountId: labourerAcc.id,
            date: set.settlementDate,
            debit: paid,
            credit: 0,
            sourceType: 'LABOUR_SETTLEMENT',
            sourceId: set.id,
            note: `Payment made during settlement up to ${set.settlementDate.toISOString().split('T')[0]}`,
          },
        });

        // Credit Cash (Asset decreases)
        await prisma.ledgerEntry.create({
          data: {
            transactionId: `${transactionId}-PAYMENT`,
            accountId: systemAccounts['CASH'].id,
            date: set.settlementDate,
            debit: 0,
            credit: paid,
            sourceType: 'LABOUR_SETTLEMENT',
            sourceId: set.id,
            note: `Payment made during settlement up to ${set.settlementDate.toISOString().split('T')[0]}`,
          },
        });
      }
    }
    console.log(`  Successfully migrated ${settlements.length} settlements.`);

    console.log('\n--- Ledger Data Backfill Migration Successfully Completed ---');

  } catch (error) {
    console.error('Error during ledger backfill migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
