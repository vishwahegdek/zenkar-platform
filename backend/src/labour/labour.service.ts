
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LabourService {
  constructor(private prisma: PrismaService) {}

  async getDailyView(date: Date) {
    // 1. Get all labourers (Active only)
    const labourers = await this.prisma.labourer.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    });

    // 2. Get attendance records for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        labourerId: { in: labourers.map(c => c.id) },
      },
    });

    // 3. Get paymnets (Expenses) for this date
    const expenses = await this.prisma.expense.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        labourerId: { in: labourers.map(c => c.id) },
      },
    });

    // 4. Merge data
    return labourers.map(labourer => {
      const att = attendances.find(a => a.labourerId === labourer.id);
      const exp = expenses.find(e => e.labourerId === labourer.id);
      return {
        id: labourer.id,
        name: labourer.name,
        defaultDailyWage: labourer.defaultDailyWage,
        attendance: att ? att.value : 0,
        amount: exp ? exp.amount : 0,
      };
    });
  }

  async updateDailyView(userId: number, dateStr: string, updates: { contactId: number; attendance: number; amount: number }[]) {
    // Note: Frontend sends 'contactId' because we reused previous logic. 
    // We should treat it as labourerId now.
    const date = new Date(dateStr);
    
    for (const update of updates) {
       const labourerId = update.contactId;

       // A. Attendance
       if (update.attendance > 0) {
         const existing = await this.prisma.attendance.findFirst({
           where: { labourerId, date },
         });
         
         if (existing) {
           if (Number(existing.value) !== update.attendance) {
              await this.prisma.attendance.update({ where: { id: existing.id }, data: { value: update.attendance } as any});
           }
         } else {
           await this.prisma.attendance.create({
             data: { labourerId, date, value: update.attendance } as any
           });
         }
       } else {
         await this.prisma.attendance.deleteMany({
            where: { labourerId, date }
         });
       }

       // B. Expense (Payment)
       if (update.amount > 0) {
          let labourCategory = await this.prisma.expenseCategory.findUnique({ where: { name: 'Labour' } });
          if (!labourCategory) {
             labourCategory = await this.prisma.expenseCategory.create({ data: { name: 'Labour' } });
          }
          const categoryId = labourCategory.id; 

          const existingExp = await this.prisma.expense.findFirst({
             where: { labourerId, date: { equals: date } } 
          });

          if (existingExp) {
            if (Number(existingExp.amount) !== update.amount) {
               await this.prisma.expense.update({ where: { id: existingExp.id }, data: { amount: update.amount, updatedById: userId } as any});
            }
          } else {
            await this.prisma.expense.create({
              data: {
                labourerId,
                categoryId,
                amount: update.amount,
                date: date,
                description: 'Daily Labour Wage',
                // createdById: userId // Optional: could still track who created it if passed in updates
              } as any
            });
          }
       } else {
           await this.prisma.expense.deleteMany({
             where: { labourerId, date: date }
           });
       }
    }
    
    return { success: true };
  }

  async getReport(from?: string, to?: string, labourerId?: number) {
    const where: any = { isDeleted: false };
    if (labourerId) {
        where.id = labourerId;
    }

    const labourers = await this.prisma.labourer.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const dateFilter: any = {};
    if (from || to) {
      if (from) dateFilter.gte = new Date(from);
      if (to) dateFilter.lte = new Date(to);
    }

    const reportData: any[] = [];

    for (const labourer of labourers) {
      const attWhere: any = { labourerId: labourer.id };
      const expWhere: any = { labourerId: labourer.id };
      
      if (Object.keys(dateFilter).length > 0) {
          attWhere.date = dateFilter;
          expWhere.date = dateFilter;
      }

      const attendances = await this.prisma.attendance.findMany({
        where: attWhere,
        orderBy: { date: 'asc' },
      });

      const expenses = await this.prisma.expense.findMany({
        where: expWhere,
        orderBy: { date: 'asc' },
      });

      let totalDays = 0;
      let totalPaid = 0;
      const salary = Number(labourer.defaultDailyWage) || 0;

      const recordMap = new Map();

      attendances.forEach(a => {
        const d = a.date.toISOString().split('T')[0];
        if (!recordMap.has(d)) recordMap.set(d, { date: d, attendance: 0, amount: 0 });
        const rec = recordMap.get(d);
        rec.attendance = Number(a.value);
        totalDays += rec.attendance;
      });

      expenses.forEach(e => {
        const d = e.date.toISOString().split('T')[0];
        if (!recordMap.has(d)) recordMap.set(d, { date: d, attendance: 0, amount: 0 });
        const rec = recordMap.get(d);
        rec.amount += Number(e.amount);
        totalPaid += rec.amount;
      });

      const records = Array.from(recordMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      const totalSalary = totalDays * salary;
      const balance = totalSalary - totalPaid;

      reportData.push({
        id: labourer.id,
        name: labourer.name,
        salary: Number(salary), // Legacy support for LabourReport
        defaultDailyWage: Number(salary), // Support for LabourManage
        totalDays,
        totalSalary,
        totalPaid,
        balance,
        records
      });
    }

    return reportData;
  }

  async createLabourer(data: { name: string; defaultDailyWage: number }) {
      return this.prisma.labourer.create({
          data: {
              // userId,
              name: data.name,
              defaultDailyWage: data.defaultDailyWage
          }
      });
  }

  async updateLabourer(id: number, data: { name: string; defaultDailyWage: number }) {
      // Ensure specific user owns it - REMOVED for shared access
      const existing = await this.prisma.labourer.findFirst({ where: { id } });
      if (!existing) throw new Error("Labourer not found");

      return this.prisma.labourer.update({
          where: { id },
          data: {
              name: data.name,
              defaultDailyWage: data.defaultDailyWage
          }
      });
  }

  async deleteLabourer(id: number) {
      const existing = await this.prisma.labourer.findFirst({ where: { id } });
      if (!existing) throw new Error("Labourer not found");

      // Soft Delete
      return this.prisma.labourer.update({
          where: { id },
          data: { isDeleted: true }
      });
  }
}
