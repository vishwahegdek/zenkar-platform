import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { addDays } from 'date-fns';

describe('Production System (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  // Variables to hold IDs for cleanup/verification
  let categoryId: number;
  let productId: number;
  let contactId: number;
  let orderId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    // Cleanup - Order independent if IDs managed well, but dependencies exist
    if (orderId) {
      await request(app.getHttpServer())
        .delete(`/orders/${orderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
    // Product must be deleted before Category can be deleted (FK constraint)
    if (productId) {
      await request(app.getHttpServer())
        .delete(`/products/${productId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
    if (categoryId) {
      await request(app.getHttpServer())
        .delete(`/product-categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
    await app.close();
  });

  it('/product-categories (POST) - Create Category', async () => {
    const res = await request(app.getHttpServer())
      .post('/product-categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Production Category' })
      .expect(201);

    categoryId = res.body.id;
    expect(res.body.name).toBe('Test Production Category');
  });

  it('/products (POST) - Create Product in Category', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Production Item',
        defaultUnitPrice: 1000,
        categoryId: categoryId,
        notes: 'For E2E Testing',
      })
      .expect(201);

    productId = res.body.id;
    expect(res.body.categoryId).toBe(categoryId);
  });

  it('/contacts (POST) - Create Customer Contact', async () => {
    const res = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Prod Test Client',
        phone: '9988009988',
        skipGoogleSync: true,
      })
      .expect(201);
    contactId = res.body.id;
  });

  it('/orders (POST) - Create Confirmed Order', async () => {
    const dueDate = addDays(new Date(), 5).toISOString();

    const res = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        contactId: contactId,
        customerName: 'Prod Test Client',
        customerPhone: '9988009988',
        orderDate: new Date().toISOString(),
        dueDate: dueDate,
        paymentMethod: 'CASH',
        status: 'confirmed', // Important: Must be confirmed/production to show up
        items: [
          {
            productId: productId,
            quantity: 10,
            unitPrice: 1000,
            lineTotal: 10000,
            description: 'Test Spec',
          },
        ],
        totalAmount: 10000,
      })
      .expect(201);

    orderId = res.body.id;
    expect(res.body.status).toBe('confirmed');
  });

  it('/orders/production/items (GET) - Verify Item in Production List', async () => {
    const res = await request(app.getHttpServer())
      .get(`/orders/production/items?categoryId=${categoryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const item = res.body.find((i) => i.productName === 'Test Production Item');
    expect(item).toBeDefined();
    expect(item.quantity).toBe(10);
    expect(item.orderNo).toBeDefined();
    expect(item.customerName).toBe('Prod Test Client');
  });

  it('/orders/production/items (GET) - Verify Filtering by Product', async () => {
    const res = await request(app.getHttpServer())
      .get(
        `/orders/production/items?categoryId=${categoryId}&productId=${productId}`,
      )
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const item = res.body.find((i) => i.productName === 'Test Production Item');
    expect(item).toBeDefined();
  });

  it('/orders/production/items (GET) - Verify Empty for Wrong Product', async () => {
    // Use a non-existent product ID or just a random number
    const res = await request(app.getHttpServer())
      .get(`/orders/production/items?categoryId=${categoryId}&productId=999999`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.length).toBe(0);
  });
});
