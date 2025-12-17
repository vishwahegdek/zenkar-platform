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

  let largeOrderId: number;

  it('/orders (POST) - Create Large Order', async () => {
    const items: any[] = [];
    for (let i = 0; i < 20; i++) {
        items.push({
            productName: `Bulk Item ${i}`,
            quantity: 1,
            unitPrice: 100,
            lineTotal: 100
        });
    }

    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: 0,
        customerName: 'Bulk Buyer',
        customerPhone: '9988776655',
        customerAddress: 'Bulk Address',
        orderDate: new Date().toISOString(),
        totalAmount: 2000,
        advanceAmount: 0,
        items: items
      })
      .expect(201);
      
    largeOrderId = response.body.id;
  });

  it('/orders/:id (PATCH) - Update Customer to Existing Customer', async () => {
    // 1. Create a dummy second customer
    const custRes = await request(app.getHttpServer())
      .post('/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Another Customer', phone: '1112223333' });
    const secondCustId = custRes.body.id;

    // 2. Update createdOrderId to point to secondCustId
    const response = await request(app.getHttpServer())
      .patch(`/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: secondCustId,
        customerName: 'Another Customer'
      })
      .expect(200);

    expect(response.body.customer.id).toBe(secondCustId);
    expect(response.body.customer.name).toBe('Another Customer');
  });

  it('/orders/:id (PATCH) - Update Customer to New Customer (Fix Verification)', async () => {
    // 1. Create a Contact first (to avoid FK violation)
    const contactRes = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Contact For Order', phone: '5555555555' })
      .expect(201);
    const contactId = contactRes.body.id;

    // 2. Update order to use this contact (`customerId: 0` triggers creation)
    const response = await request(app.getHttpServer())
      .patch(`/orders/${createdOrderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: 0,
        customerName: 'Contact Converted User',
        customerPhone: '5555555555',
        contactId: contactId, // Now valid
        paymentMethod: 'CASH', // Regression check: Should be excluded from Order update
      })
      .expect(200);

    // Verify order is linked to a NEW customer
    expect(response.body.customer.name).toBe('Contact Converted User');
    expect(response.body.customer.phone).toBe('5555555555');
    expect(response.body.customer.contactId).toBe(contactId);
    expect(response.body.customerId).not.toBe(0); 
  });

  it('/orders (POST) - Create New Order with New Customer from Contact', async () => {
    // 1. Create a Contact
    const contactRes = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'New Order Contact', phone: '9998887777' })
      .expect(201);
    const contactId = contactRes.body.id;

    // 2. Create Order with this contact
    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: 0,
        customerName: 'New Order User',
        customerPhone: '9998887777',
        contactId: contactId,
        orderDate: '2025-10-10',
        totalAmount: 500,
        items: [{ productName: 'Item A', quantity: 1, unitPrice: 500, lineTotal: 500 }]
      })
      .expect(201);

    expect(response.body.customer.name).toBe('New Order User');
    expect(response.body.customer.contactId).toBe(contactId);
  });

  it('/orders (POST) - Quick Sale with New Customer from Contact', async () => {
    // 1. Create a Contact
    const contactRes = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Quick Sale Contact', phone: '1110001110' })
      .expect(201);
    const contactId = contactRes.body.id;

    // 2. Create Quick Sale Order
    const response = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: 0,
        customerName: 'Quick Sale User',
        contactId: contactId,
        isQuickSale: true,
        orderDate: '2025-10-12',
        totalAmount: 200,
        items: [{ productName: 'Quick Item', quantity: 1, unitPrice: 200, lineTotal: 200 }]
      })
      .expect(201);

    expect(response.body.customer.name).toBe('Quick Sale User');
    expect(response.body.customer.contactId).toBe(contactId);
    expect(response.body.isQuickSale).toBe(true);
  });

  it('/orders/:id (DELETE) - Cleanup', async () => {
    if (createdOrderId) {
        await request(app.getHttpServer())
        .delete(`/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    }
    
    if (largeOrderId) {
        await request(app.getHttpServer())
        .delete(`/orders/${largeOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    }
  });
});
