
const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');

const mongoUri = 'mongodb+srv://vishwahegdek:n22eQ2XVpXxFBDZs@cluster0.dj4mlzp.mongodb.net/test?retryWrites=true&w=majority';

// Define minimal schema for reading
const EmployeeSchema = new mongoose.Schema({
  name: String,
  salary: Number,
  active: Boolean,
  records: [{
    date: Date,
    attendance: Number,
    amount: Number
  }]
}, { strict: false });

const Employee = mongoose.model('Employee', EmployeeSchema, 'employees'); // collection: employees

const prisma = new PrismaClient();

async function importData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const employees = await Employee.find({});
    console.log(`Found ${employees.length} employees in diverse collection.`);

    const user = await prisma.user.findFirst();
    if (!user) {
      console.error("No PostgreSQL user found. Please seed the DB first.");
      process.exit(1);
    }
    console.log(`Importing for User: ${user.username} (ID: ${user.id})`);

    // Ensure 'Labour' category exists
    let labourCategory = await prisma.expenseCategory.findUnique({ where: { name: 'Labour' } });
    if (!labourCategory) {
        labourCategory = await prisma.expenseCategory.create({ data: { name: 'Labour', userId: user.id } });
    }

    console.log("Clearing existing labour data...");
    await prisma.attendance.deleteMany({});
    await prisma.expense.deleteMany({ where: { NOT: { labourerId: null } } });
    await prisma.labourer.deleteMany({});

    for (const emp of employees) {
      const name = emp.name ? emp.name.trim() : "Unknown";
      console.log(`Processing ${name}... (Active: ${emp.active})`);
      
      if (emp.active === false) {
           console.log(`  Skipping inactive labourer: ${name}`);
           continue; 
      }

      // Check if exists (dupe check within import)
      let labourer = await prisma.labourer.findFirst({
        where: { userId: user.id, name: name }
      });

      /* inactive check moved up */

      if (!labourer) {
        labourer = await prisma.labourer.create({
          data: {
            userId: user.id,
            name: name,
            defaultDailyWage: emp.salary || 0
          }
        });
        console.log(`  Created Labourer: ${labourer.name}`);
      } else {
        console.log(`  Labourer ${name} already exists. checking records...`);
      }

      if (emp.records && emp.records.length > 0) {
        for (const rec of emp.records) {
          const date = new Date(rec.date);
          if (isNaN(date.getTime())) continue;

          // Attendance
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
            }
          }

          // Payment
          if (rec.amount > 0) {
              // Check if payment exists on that date for that labourer
              // Since multiple payments could exist, this logic is tricky.
              // We'll check if ANY expense exists for that day.
              // Ideally validation should be more robust (exact amount?), but for legacy import this is safer to avoid dupes.
              const existingExp = await prisma.expense.findFirst({
                  where: { labourerId: labourer.id, date: date, amount: rec.amount }
              });

              if(!existingExp) {
                  await prisma.expense.create({
                      data: {
                          categoryId: labourCategory.id,
                          labourerId: labourer.id,
                          amount: rec.amount,
                          date: date,
                          description: 'Legacy Import'
                      }
                  });
              }
          }
        }
      }
    }

    console.log("Import Complete!");

  } catch (error) {
    console.error("Import Error:", error);
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
  }
}

importData();
