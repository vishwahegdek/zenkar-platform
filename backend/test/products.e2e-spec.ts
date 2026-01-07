import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ProductsSystem (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdProductId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/products (POST) - Create Product', async () => {
    const response = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Product E2E',
        defaultUnitPrice: 1500,
        notes: 'Created by E2E',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Product E2E');
    createdProductId = response.body.id;
  });

  it('/products (GET) - List Products', async () => {
    const response = await request(app.getHttpServer())
      .get('/products?query=Test Product E2E')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const product = response.body.find((p) => p.id === createdProductId);
    expect(product).toBeDefined();
  });

  it('/products/:id (GET) - Get One', async () => {
    const response = await request(app.getHttpServer())
      .get(`/products/${createdProductId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.id).toBe(createdProductId);
    expect(response.body.name).toBe('Test Product E2E');
  });

  it('/products/:id (PATCH) - Update Product', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/products/${createdProductId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        defaultUnitPrice: 2000,
      })
      .expect(200);

    expect(Number(response.body.defaultUnitPrice)).toBe(2000);
  });

  it('/products/:id (DELETE) - Delete Product', async () => {
    await request(app.getHttpServer())
      .delete(`/products/${createdProductId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify deletion (it might be soft delete so check properties or 404 depending on logic)
    // ProductsController comments said "soft delete".
    // Usually findAll filters out deleted.

    const response = await request(app.getHttpServer())
      .get('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const product = response.body.find((p) => p.id === createdProductId);
    expect(product).toBeUndefined();
  });
});
