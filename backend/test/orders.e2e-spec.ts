import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('OrdersSystem (e2e)', () => {
  let app: INestApplication;
  let createdOrderId: number;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    // Login for token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/orders (POST) - Create Order with Indian Context', async () => {
    const orderData = {
      customerName: 'Rajesh Kumar',
      customerPhone: '9876543210',
      customerAddress: '123, MG Road, Indiranagar, Bangalore',
      customerId: 0, // 0 triggers new customer creation logic
      orderDate: '2025-10-01',
      items: [
        {
          productName: 'Teak Wood Coffee Table', // Realistic furniture
          description: '3x3 feet with glass top',
          quantity: 1,
          unitPrice: 15000,
          lineTotal: 15000,
        }
      ],
      totalAmount: 15000,
      advanceAmount: 5000, // Initial advance is handled as payment now
    };

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send(orderData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.customer.name).toBe('Rajesh Kumar');
    createdOrderId = response.body.id;
  });

  it('/orders/:id/payments (POST) - Add Partial Payment', async () => {
    const paymentData = {
      amount: 5000,
      date: '2025-10-05',
      note: 'UPI Payment'
    };

    await request(app.getHttpServer())
      .post(`/orders/${createdOrderId}/payments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(paymentData)
      .expect(201);
  });

  it('/orders/:id (GET) - Verify Balance', async () => {
    const response = await request(app.getHttpServer())
      .get(`/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Total: 15000. Advance: 5000 (from create). Payment: 5000. Total Paid: 10000. Balance: 5000.
    // Note: create() logic: "Capture initial advance... Create Initial Payment".
    // So there should be 2 payments now.
    
    const paidAmount = response.body.paidAmount; // Helper we added returns this
    const remainingBalance = response.body.remainingBalance;

    expect(Number(paidAmount)).toBe(10000);
    expect(Number(remainingBalance)).toBe(5000);
  });

  it('/orders/:id (PATCH) - Close Order and Write-off Balance', async () => {
    // Closing order with 5000 balance should create 5000 discount
    await request(app.getHttpServer())
      .patch(`/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'closed' })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get(`/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.status).toBe('closed');
    expect(Number(response.body.remainingBalance)).toBe(0);
    expect(Number(response.body.discount)).toBe(5000);
  });

  it('/orders/:id (DELETE) - Cleanup', async () => {
    await request(app.getHttpServer())
      .delete(`/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });
});
