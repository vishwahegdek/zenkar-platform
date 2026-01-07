import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as supertest from 'supertest';
import { AppModule } from './../src/app.module';

describe('Strict Order Module (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdContactId: number;
  let createdProductId: number;
  let createdCustomerId: number;
  let request: any; // Dynamic request handler

  beforeAll(async () => {
    request = (supertest as any).default || supertest; // Handle ESM/CommonJS mismatch

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    ); // Mimic Main.ts
    await app.init();

    // 0. Login/Auth Setup
    console.log('Attempting login...');
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });

    console.log('Login Status:', loginRes.status);

    // If login fails (no seed), create user
    if (loginRes.status !== 201 && loginRes.status !== 200) {
      console.log('Login failed, registering testuser...');
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'testuser', password: 'password123' });
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' });
      authToken = res.body.access_token;
      console.log('Registered & Logged in. Token:', authToken ? 'Yes' : 'No');
    } else {
      authToken = loginRes.body.access_token;
      console.log('Logged in as Admin. Token:', authToken ? 'Yes' : 'No');
    }
  });

  // --- Step 1: Contacts ---
  describe('Step 1: Contacts Module', () => {
    it('should fail if PHONE is missing', async () => {
      await request(app.getHttpServer())
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'No Phone Guy' })
        .expect(400)
        .expect((res) => {
          if (!JSON.stringify(res.body).includes('phone'))
            throw new Error('Error message missing "phone" validation');
        });
    });

    it('should fail if NAME is missing', async () => {
      await request(app.getHttpServer())
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ phone: '9988776655' })
        .expect(400);
    });

    it('should create contact successfully with Name and Phone', async () => {
      const res = await request(app.getHttpServer())
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Valid Contact', phone: '9988776655' })
        .expect(201);
      createdContactId = res.body.id;
    });

    it('should list contacts and verify', async () => {
      const res = await request(app.getHttpServer())
        .get('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      const item = res.body.find((c) => c.id === createdContactId);
      expect(item).toBeDefined();
      expect(item.name).toBe('Valid Contact');
    });

    it('should update contact', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Contact' });

      expect(res.status).toBe(200);
    });

    it('should delete contact', async () => {
      // Will delete later as we might need it for Customer tests
      // expect(true).toBe(true);
    });
  });

  // --- Step 2: Customers ---
  describe('Step 2: Customer Module', () => {
    it('should fail if valid fields missing (No Name, No ContactId)', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ address: 'Some place' })
        .expect(400); // Expect Bad Request via Service conditional check
    });

    it('should fail if name is too short (< 6)', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Bobs' })
        .expect(400);
    });

    it('should create customer via ContactID (Smart Select)', async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ contactId: createdContactId }) // No Name provided
        .expect(201);
      createdCustomerId = res.body.id;
      expect(res.body.name).toBe('Updated Contact'); // Should inherit from Contact
    });

    it('should get customer detail', async () => {
      await request(app.getHttpServer())
        .get(`/customers/${createdCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  // --- Step 3: Products ---
  describe('Step 3: Products Module', () => {
    it('should fail if name missing', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ defaultUnitPrice: 10 })
        .expect(400);
    });
    it('should fail if defaultUnitPrice missing', async () => {
      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Prod' })
        .expect(400);
    });

    it('should create product successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Strict Product', defaultUnitPrice: 100 })
        .expect(201);
      createdProductId = res.body.id;
    });
  });

  // --- Step 4: Orders ---
  describe('Step 4: Orders Module', () => {
    it('should fail if items empty', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: createdCustomerId,
          totalAmount: 100,
          paymentMethod: 'CASH',
          items: [],
        })
        .expect(400);
    });

    it('should succeed if paymentMethod missing (Optional)', async () => {
      return request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contactId: createdContactId,
          items: [{ productId: createdProductId, quantity: 1, unitPrice: 100 }],
          // paymentMethod omitted
        })
        .expect(201);
    });

    it('should fail if CustomerId AND ContactId missing (Standard Order)', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          totalAmount: 100,
          paymentMethod: 'CASH',
          items: [
            {
              productId: createdProductId,
              quantity: 1,
              unitPrice: 100,
              lineTotal: 100,
            },
          ],
        })
        .expect(400);
    });

    it('should create order successfully with CustomerID', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: createdCustomerId,
          totalAmount: 100,
          paymentMethod: 'CASH',
          customerName: 'Should Be Ignored', // Test ignore
          items: [
            {
              productId: createdProductId,
              quantity: 1,
              unitPrice: 100,
              lineTotal: 100,
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.customer.name).not.toBe('Should Be Ignored'); // Verify ignore
          expect(res.body.status).toBe('enquired'); // Verify default
        });
    });

    it('should create order successfully with ContactID (Auto Resolve)', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contactId: createdContactId, // No Customer Id
          totalAmount: 100,
          paymentMethod: 'UPI',
          items: [
            {
              productId: createdProductId,
              quantity: 1,
              unitPrice: 100,
              lineTotal: 100,
            },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.customer.id).toBeDefined();
        });
    });

    // Reproduction Test Case for Bug
    it('should create payment record if advanceAmount is provided', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId: createdCustomerId,
          totalAmount: 100,
          advanceAmount: 50,
          paymentMethod: 'CASH',
          items: [
            {
              productId: createdProductId,
              quantity: 1,
              unitPrice: 100,
              lineTotal: 100,
            },
          ],
        })
        .expect(201);

      expect(res.body.payments).toBeDefined();
      expect(res.body.payments.length).toBeGreaterThan(0);
      expect(Number(res.body.payments[0].amount)).toBe(50);
      expect(res.body.payments[0].note).toBe('Initial Advance');
    });
  });

  // --- Step 5: Payments ---
  describe('Step 5: Payments Module', () => {
    let orderId: number;

    beforeAll(async () => {
      // Create a fresh order for payment testing
      const res = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contactId: createdContactId,
          totalAmount: 500,
          items: [{ productId: createdProductId, quantity: 5, unitPrice: 100 }],
        });
      orderId = res.body.id;
    });

    it('should add payment with Method UPI', async () => {
      await request(app.getHttpServer())
        .post(`/orders/${orderId}/payments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 200, method: 'UPI', date: new Date().toISOString() })
        .expect(201);
    });

    it('should verify payment in order details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const payment = res.body.payments.find((p) => Number(p.amount) === 200);
      expect(payment).toBeDefined();
      expect(payment.method).toBe('UPI');
    });
  });

  afterAll(async () => {
    // Cleanup DELETE endpoints
    if (createdContactId) {
      await request(app.getHttpServer())
        .delete(`/contacts/${createdContactId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    }
    if (createdCustomerId) {
      await request(app.getHttpServer())
        .delete(`/customers/${createdCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    }
    if (createdProductId) {
      await request(app.getHttpServer())
        .delete(`/products/${createdProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    }
    await app.close();
  });
});
