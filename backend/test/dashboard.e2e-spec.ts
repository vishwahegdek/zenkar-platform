import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

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
    await app.close();
  });

  it('/dashboard/stats (GET) - Structure Check', async () => {
    const response = await request(app.getHttpServer())
      .get('/dashboard/stats')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Structure check according to what frontend expects
    expect(response.body).toHaveProperty('totalSales');
    expect(response.body).toHaveProperty('totalReceived');
    expect(response.body).toHaveProperty('transactionsCount');
    
    // Values might be strings (Decimal from DB) or numbers depending on serialization
    // Frontend handles both, but let's check what we get
    console.log('Dashboard Stats:', response.body);
  });

  it('/dashboard/payments (GET) - List Check', async () => {
    const response = await request(app.getHttpServer())
      .get('/dashboard/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('customerName');
        expect(response.body[0]).toHaveProperty('amount');
        expect(response.body[0]).toHaveProperty('date');
    }
  });

  it('/dashboard/activities (GET) - Audit Log Check', async () => {
    const response = await request(app.getHttpServer())
      .get('/dashboard/activities')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('action');
        expect(response.body[0]).toHaveProperty('resource');
    }
  });
});
