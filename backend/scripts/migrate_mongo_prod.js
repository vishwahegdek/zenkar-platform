
const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');

// Schema for reading legacy data
const EmployeeSchema = new mongoose.Schema({
  name: String,
  salary: Number,
  active: Boolean,
  records: [{
    date: Date,
    attendance: Number, // 0.5 or 1
    amount: Number      // Payment amount
  }]
}, { strict: false });

const Employee = mongoose.model('Employee', EmployeeSchema, 'employees');

const prisma = new PrismaClient();

async function migrateData() {
  const args = process.argv.slice(2);
  const mongoUri = args[0];

  if (!mongoUri) {
    console.error("Usage: node migrate_mongo_prod.js <MONGO_URI>");
    process.exit(1);
  }

  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const employees = await Employee.find({});
    console.log(`📊 Found ${employees.length} employees to process.`);

    // 1. Get Admin User (to own records)
    const user = await prisma.user.findFirst({ orderBy: { id: 'asc' } });
    if (!user) {
      throw new Error("❌ No users found in Postgres. Please seed or create a user first.");
    }
    console.log(`👤 associating data with User: ${user.username} (ID: ${user.id})`);

    // 2. Ensure Category 'Labour'
    let labourCategory = await prisma.expenseCategory.findUnique({ where: { name: 'Labour' } });
    if (!labourCategory) {
        console.log("⚠️ 'Labour' category missing. Creating it...");
        labourCategory = await prisma.expenseCategory.create({ data: { name: 'Labour' } });
    }
    console.log(`📂 Expense Category: Labour (ID: ${labourCategory.id})`);

    // 3. Process Employees
    for (const emp of employees) {
      const name = emp.name ? emp.name.trim() : "Unknown";
      
      // Skip intentionally IF needed, but user didn't ask to skip inactive. 
      // We will migrate all to preserve history.
      
      console.log(`\n🔄 Processing: ${name} (Active: ${emp.active})`);

      // 3a. Create/Find Labourer
      let labourer = await prisma.labourer.findFirst({
        where: { name: name }
      });

      if (!labourer) {
        labourer = await prisma.labourer.create({
          data: {
            // userId: user.id, // Removed for shared access
            name: name,
            defaultDailyWage: emp.salary || 0,
            isDeleted: emp.active === false // Map active status
          }
        });
        console.log(`   ✅ Created Labourer: ${name}`);
      } else {
        console.log(`   ℹ️ Labourer exists.`);
      }

      // 3b. Create/Find Recipient (For Payments/Expenses)
      // We map the Labour Name directly to a Recipient Name
      let recipient = await prisma.recipient.findFirst({
         where: { userId: user.id, name: name }
      });

      if (!recipient) {
          recipient = await prisma.recipient.create({
              data: {
                  userId: user.id,
                  name: name
                  // We could link contact_id here if we had one, but we don't.
              }
          });
          console.log(`   ✅ Created Recipient: ${name}`);
      }

      // 3c. Process Records (Attendance & Payments)
      if (emp.records && emp.records.length > 0) {
        let attCount = 0;
        let expCount = 0;

        for (const rec of emp.records) {
          const date = new Date(rec.date);
          if (isNaN(date.getTime())) continue;

          // --- Attendance ---
          if (rec.attendance > 0) {
            const existingAtt = await prisma.attendance.findFirst({
                where: { labourerId: labourer.id, date: date }
            });
            
            if(!existingAtt) {
                await prisma.attendance.create({
                    data: {
                        labourerId: labourer.id,
                        date: date,
                        value: rec.attendance
                    }
                });
                attCount++;
            }
          }

          // --- Payments (Expenses) ---
          // Mapped to Expense table.
          // Linked to Recipient.
          // Category = Labour.
          // link to labourer_id is DEPRECATED/IGNORED as per request.
          if (rec.amount > 0) {
              const existingExp = await prisma.expense.findFirst({
                  where: { 
                      recipientId: recipient.id, 
                      date: date, 
                      amount: rec.amount,
                      categoryId: labourCategory.id
                  }
              });

              if(!existingExp) {
                  await prisma.expense.create({
                      data: {
                          categoryId: labourCategory.id,
                          recipientId: recipient.id, 
                          // labourerId: null, // Ignored
                          // recipientLinkId: null, // Ignored
                          amount: rec.amount,
                          date: date, // Keep original date
                          description: 'Imported from MongoDB', // Audit trail
                          createdById: user.id
                      }
                  });
                  expCount++;
              }
          }
        }
        console.log(`   Summary: +${attCount} Attendance, +${expCount} Expenses`);
      }
    }

    console.log("\n✅ Migration Completed Successfully!");

  } catch (error) {
    console.error("\n❌ Migration Failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
  }
}

migrateData();
