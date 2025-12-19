
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('OrdersController (Search)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    authToken = loginRes.body.access_token;
  });

  afterEach(async () => {
      await app.close();
  });

  it('/orders (GET) - should return structure with data and meta', async () => {
    const response = await request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('/orders (GET) with search - should return filtered results', async () => {
     const response = await request(app.getHttpServer())
         .get('/orders?search=NonExistentCustomerXYZ')
         .set('Authorization', `Bearer ${authToken}`);
     
     if (response.status !== 200) {
         console.error('Test Failed Status:', response.status);
         console.error('Test Failed Body:', JSON.stringify(response.body, null, 2));
     }
     expect(response.status).toBe(200);
         
     expect(response.body.data).toEqual([]);
     expect(response.body.meta.total).toBe(0);
  });
  
  // NOTE: If we want to test positive search, we'd need to seed data in test or use existing seed.
  // For now, testing structure safety.
});
