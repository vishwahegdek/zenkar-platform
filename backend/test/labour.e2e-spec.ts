
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { addDays, subDays, format } from 'date-fns';

describe('LabourSystem Comprehensive Coverage (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let labourerId: number;
  let DEFAULT_WAGE = 500;
  
  // Test Data Accumulators
  let expectedDays = 0;
  let expectedPaid = 0;
  let daysData: any[] = [];

  // Dates
  const today = new Date();
  const START_DATE = subDays(today, 20); 
  const SETTLEMENT_DATE = subDays(today, 10); // Settle at Day 10

  const dateStr = (d: Date) => format(d, 'yyyy-MM-dd');

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    if (labourerId) {
        // Hard delete not exposed, relying on soft delete test for logic
    }
    await app.close();
  });

  // --- SCENARIO IMPLEMENTATION ---

  it('1. Create Labourer', async () => {
    const res = await request(app.getHttpServer())
      .post('/labour')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: `Rigorous Test Payload ${Date.now()}`,
        defaultDailyWage: DEFAULT_WAGE
      })
      .expect(201);
    
    labourerId = res.body.id;
    expect(labourerId).toBeDefined();
    console.log(`\n    -> Created Labourer ID: ${labourerId}`);
  });

  it('2. Enter Random Data (15 Days)', async () => {
      // Loop 15 days starting from START_DATE
      for (let i = 0; i < 15; i++) {
          const currentDay = addDays(START_DATE, i);
          const dString = dateStr(currentDay);

          // Random Attendance: 0, 0.5, 1
          const choices = [0, 0.5, 1];
          const att = choices[Math.floor(Math.random() * choices.length)];
          
          // Random Pay: 0 to 500
          const pay = Math.floor(Math.random() * 501);

          daysData.push({ date: currentDay, attendance: att, amount: pay });
          expectedDays += att;
          expectedPaid += pay;

          // Push to API
          await request(app.getHttpServer())
            .post('/labour/daily')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                date: dString,
                updates: [{ contactId: labourerId, attendance: att, amount: pay }]
            })
            .expect(201);
      }
      console.log(`    -> Generated 15 days data. Expected Days: ${expectedDays}, Expected Paid: ${expectedPaid}`);
  });

  it('3. Cross Check Pre-Settlement Report', async () => {
      const res = await request(app.getHttpServer())
        .get('/labour/report')
        .query({ labourerId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const report = res.body[0];
      const salary = expectedDays * DEFAULT_WAGE;
      const balance = salary - expectedPaid;

      console.log(`    -> Checking Report: Days ${report.totalDays} vs ${expectedDays}`);
      
      expect(report.totalDays).toBe(expectedDays);
      expect(Number(report.totalPaid)).toBe(expectedPaid);
      expect(Number(report.totalSalary)).toBe(salary);
      expect(Number(report.balance)).toBe(balance);
  });

  it('4. Settle on Day 10', async () => {
      // Settle at SETTLEMENT_DATE (approx middle of our 15 days)
      // Filter our expected data to find what remains AFTER settlement date
      const settleStr = dateStr(SETTLEMENT_DATE);
      console.log(`    -> Settling up to ${settleStr}`);

      await request(app.getHttpServer())
        .post(`/labour/${labourerId}/settle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ settlementDate: settleStr, note: 'Mid-Test Settlement' })
        .expect(201);

      // Recalculate Expectation (Data ONLY > Settlement Date)
      expectedDays = 0;
      expectedPaid = 0;
      daysData.forEach(d => {
          if (d.date > SETTLEMENT_DATE) { // Strict Greater Than for Active Report
               expectedDays += d.attendance;
               expectedPaid += d.amount;
          }
      });
      console.log(`    -> New Period Expectations: Days ${expectedDays}, Paid ${expectedPaid}`);
  });

  it('4b. Verify Post-Settlement Report', async () => {
      const res = await request(app.getHttpServer())
        .get('/labour/report')
        .query({ labourerId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const report = res.body[0];
      const salary = expectedDays * DEFAULT_WAGE;
      const balance = salary - expectedPaid;

      expect(report.totalDays).toBe(expectedDays);
      expect(Number(report.totalPaid)).toBe(expectedPaid);
      expect(Number(report.totalSalary)).toBe(salary);
      expect(Number(report.balance)).toBe(balance);
  });

  it('5. Change Salary and Verify Totals', async () => {
      const NEW_WAGE = 600;
      console.log(`    -> Updating Salary to ${NEW_WAGE}`);

      await request(app.getHttpServer())
        .post(`/labour/${labourerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Worker', defaultDailyWage: NEW_WAGE })
        .expect(201);

      // Verify Report Update
      const res = await request(app.getHttpServer())
        .get('/labour/report')
        .query({ labourerId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const report = res.body[0];
      const newSalary = expectedDays * NEW_WAGE; // Should use new wage
      const newBalance = newSalary - expectedPaid;

      expect(Number(report.salary)).toBe(NEW_WAGE);
      expect(Number(report.totalSalary)).toBe(newSalary);
      expect(Number(report.balance)).toBe(newBalance);
  });

  it('5b. Verify Immutable Settlements (Partial Update)', async () => {
      // Attempt to modify a settled date (SETTLEMENT_DATE or before)
      // This should be IGNORED silently by backend now
      const settledDate = dateStr(subDays(SETTLEMENT_DATE, 1)); // 1 day before settlement
      
      console.log(`    -> Attempting to modify settled data on ${settledDate} (Should be ignored)`);

      await request(app.getHttpServer())
        .post('/labour/daily')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
            date: settledDate,
            updates: [{ contactId: labourerId, attendance: 0.5, amount: 999 }] // Changed values
        })
        .expect(201); // Success code, but should not have changed data

      // Verify Report Unchanged
      const res = await request(app.getHttpServer())
        .get('/labour/report')
        .query({ labourerId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const report = res.body[0];
      // Reuse previous expectations - totals should remain exactly same
      const salary = expectedDays * 600; // Wage updated in step 5
      const balance = salary - expectedPaid;

      expect(Number(report.totalPaid)).toBe(expectedPaid);
      expect(Number(report.balance)).toBe(balance);
      console.log('    -> Verified: Totals remained unchanged after attempted modification of settled data');
  });

  it('5c. Verify Carry Forward & History', async () => {
      // 1. Add fresh data for new period
      const newDate = dateStr(addDays(today, 1));
      await request(app.getHttpServer())
        .post('/labour/daily')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
            date: newDate,
            updates: [{ contactId: labourerId, attendance: 1, amount: 0 }] 
        })
        .expect(201);

      // Current State: Previous Balance (from Step 5b logic) + 1 day
      // Wait, Step 4 settled up to SETTLEMENT_DATE.
      // Expected Paid/Days are for post-settlement period.
      // Let's settle AGAIN with Carry Forward.
      
      const cfSettlementDate = dateStr(addDays(today, 2));
      console.log(`    -> Settling with Carry Forward on ${cfSettlementDate}`);

      const resSettle = await request(app.getHttpServer())
        .post(`/labour/${labourerId}/settle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ settlementDate: cfSettlementDate, isCarryForward: true })
        .expect(201);
      
      const settlementId = resSettle.body.id;
      const netBalanceAtSettlement = Number(resSettle.body.netBalance);
       
      // 2. Add data AFTER this settlement
      const postCFDate = dateStr(addDays(today, 3));
      await request(app.getHttpServer())
        .post('/labour/daily')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
            date: postCFDate,
            updates: [{ contactId: labourerId, attendance: 1, amount: 100 }] 
        })
        .expect(201);

      // 3. Verify Report: Should have Opening Balance == Previous Net Balance
      const resReport = await request(app.getHttpServer())
        .get('/labour/report')
        .query({ labourerId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const report = resReport.body[0];
      const salary = 600; // From step 5
      
      expect(Number(report.openingBalance)).toBe(netBalanceAtSettlement);
      expect(report.totalDays).toBe(1);
      expect(Number(report.totalSalary)).toBe(salary); 
      expect(Number(report.balance)).toBe(netBalanceAtSettlement + salary - 100);
      
      console.log(`    -> Verified OB: ${report.openingBalance}, Balance: ${report.balance}`);

      // 4. Verify History Fetch
      console.log(`    -> Verifying History for Settlement ID: ${settlementId}`);
      const resHistory = await request(app.getHttpServer())
        .get('/labour/report')
        .query({ labourerId, settlementId })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
        
      const histReport = resHistory.body[0];
      // Should match the state AT settlement
      expect(Number(histReport.balance)).toBe(netBalanceAtSettlement);
      expect(histReport.lastSettlementDate).not.toBe(cfSettlementDate); // Context is previous
  });

  it('6. Delete Labourer (Soft Delete)', async () => {
      await request(app.getHttpServer())
        .delete(`/labour/${labourerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify Removal from List
      const listRes = await request(app.getHttpServer())
        .get('/labour')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const exists = listRes.body.find(l => l.id === labourerId);
      expect(exists).toBeUndefined();
      
      console.log('    -> Verified labourer is removed from list');
  });

});
