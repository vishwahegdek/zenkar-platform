
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, 'legacy_data.json');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    console.log('Please export your MongoDB "employees" collection to a JSON file named "legacy_data.json" in this folder.');
    process.exit(1);
  }

  const rawData = fs.readFileSync(filePath, 'utf-8');
  const employees = JSON.parse(rawData);

  console.log(`Found ${employees.length} employees to migrate...`);
async function migrate() {
    try {
        const filePath = __dirname + '/legacy_data.json';
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            console.log('Please export your MongoDB "employees" collection to a JSON file named "legacy_data.json" in this folder.');
            process.exit(1);
        }

        const rawData = fs.readFileSync(filePath, 'utf-8');
        const employees = JSON.parse(rawData);
        
        // Find default user
        const user = await prisma.user.findFirst();
        if(!user) {
            console.error("No user found in DB. Please run seed first.");
            process.exit(1); // Added process.exit for consistency with original
        }

        console.log(`Migrating ${employees.length} employees for User: ${user.username}`);

        for(const emp of employees) {
            // Create Labourer
            const labourer = await prisma.labourer.create({
                data: {
                    userId: user.id,
                    name: emp.name,
                    defaultDailyWage: parseFloat(emp.salary || 0)
                }
            });
            console.log(`Created Labourer: ${labourer.name}`);

            if(emp.records && emp.records.length > 0) {
                for(const rec of emp.records) {
                    const date = new Date(rec.date);
                    if (isNaN(date.getTime())) {
                        console.warn(`Invalid date for ${emp.name}: ${rec.date}`);
                        continue;
                    }
                    
                    // Attendance
                    if(rec.attendance > 0) {
                        try {
                            await prisma.attendance.create({
                                data: {
                                    labourerId: labourer.id,
                                    date: date,
                                    value: parseFloat(rec.attendance)
                                }
                            });
                        } catch(e) { console.log(`Attendance skip: ${e.message}`); }
                    }

                    // Payment (Expense)
                    if(rec.amount > 0) {
                        // Ensure category exists
                        let cat = await prisma.expenseCategory.findUnique({ where: { name: 'Labour' } });
                        if(!cat) cat = await prisma.expenseCategory.create({ data: { name: 'Labour', userId: user.id } });

                        await prisma.expense.create({
                            data: {
                                categoryId: cat.id,
                                labourerId: labourer.id,
                                amount: parseFloat(rec.amount),
                                date: date,
                                description: 'Legacy Payment'
                            }
                        });
                    }
                }
            }
        }
        console.log("Migration Complete");

    } catch(e) {
        console.error(e);
        process.exit(1); // Added process.exit for consistency with original
    } finally {
        await prisma.$disconnect();
    }
}

migrate();
