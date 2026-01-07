import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from './../src/app.module';

describe('Finance Module (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let request: any;
  let creditorId: number;
  let debtorId: number;

  beforeAll(async () => {
    request = (supertest as any).default || supertest;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    // Login logic
    let loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    console.log('Login Status:', loginRes.status);
    if (loginRes.status !== 201 && loginRes.status !== 200) {
      console.log('Login failed, registering testuser...');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'financetest', password: 'password123' });
      loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'financetest', password: 'password123' });
      authToken = loginRes.body.access_token;
      console.log('Registered & Logged in. Token:', authToken ? 'Yes' : 'No');
    } else {
      authToken = loginRes.body.access_token;
      console.log('Logged in as Admin. Token:', authToken ? 'Yes' : 'No');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Part 1: Creditors (Payables)', () => {
    it('should create a Creditor', async () => {
      const res = await request(app.getHttpServer())
        .post('/finance/parties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Creditor',
          phone: '1234567890',
          type: 'CREDITOR',
          notes: 'E2E Test',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Test Creditor');
      expect(res.body.type).toBe('CREDITOR');
      creditorId = res.body.id;
    });

    it('should add BORROWED transaction', async () => {
      const res = await request(app.getHttpServer())
        .post(`/finance/parties/${creditorId}/transactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 1000,
          type: 'BORROWED',
          date: new Date().toISOString(),
          note: 'Borrowed 1000',
        });
      expect(res.status).toBe(201);
    });

    it('should add REPAID transaction', async () => {
      const res = await request(app.getHttpServer())
        .post(`/finance/parties/${creditorId}/transactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 200,
          type: 'REPAID',
          date: new Date().toISOString(),
          note: 'Repaid 200',
        });
      expect(res.status).toBe(201);
    });

    it('should verify balance (1000 - 200 = 800 Payable)', async () => {
      const res = await request(app.getHttpServer())
        .get('/finance/parties')
        .query({ type: 'CREDITOR' })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const party = res.body.find((p) => p.id === creditorId);
      expect(party).toBeDefined();
      // netBalance should be 800 (Positive for Liability/Payable)
      expect(Number(party.stats.netBalance)).toBe(800);
      expect(Number(party.stats.borrowed)).toBe(1000);
      expect(Number(party.stats.repaid)).toBe(200);
    });
  });

  describe('Part 2: Debtors (Receivables)', () => {
    it('should create a Debtor', async () => {
      const res = await request(app.getHttpServer())
        .post('/finance/parties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Debtor',
          type: 'DEBTOR',
        });

      expect(res.status).toBe(201);
      debtorId = res.body.id;
    });

    it('should add LENT transaction', async () => {
      const res = await request(app.getHttpServer())
        .post(`/finance/parties/${debtorId}/transactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 500,
          type: 'LENT',
          date: new Date().toISOString(),
        });
      expect(res.status).toBe(201);
    });

    it('should add COLLECTED transaction', async () => {
      const res = await request(app.getHttpServer())
        .post(`/finance/parties/${debtorId}/transactions`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100,
          type: 'COLLECTED',
          date: new Date().toISOString(),
        });
      expect(res.status).toBe(201);
    });

    it('should verify balance (500 - 100 = -400 Receivable/Asset)', async () => {
      // Wait, logic check:
      // Net Balance = (Borrowed - Repaid) - (Lent - Collected)
      // = (0 - 0) - (500 - 100) = -400
      // Correct. Negative means they owe us.
      const res = await request(app.getHttpServer())
        .get(`/finance/parties/${debtorId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const party = res.body;
      expect(Number(party.stats.netBalance)).toBe(-400);
      expect(Number(party.stats.lent)).toBe(500);
      expect(Number(party.stats.collected)).toBe(100);
    });
  });

  describe('Part 3: Contact Linking', () => {
    let contactId: number;

    it('should create a Contact first', async () => {
      const res = await request(app.getHttpServer())
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Linked Contact',
          phone: '5555555555',
        });
      expect(res.status).toBe(201);
      contactId = res.body.id;
    });

    it('should create Finance Party linked to Contact (No Name)', async () => {
      const res = await request(app.getHttpServer())
        .post('/finance/parties')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contactId: contactId,
          type: 'CREDITOR',
          // No name provided, should auto-resolve
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Linked Contact');
    });
  });
});
