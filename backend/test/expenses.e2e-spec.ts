
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ExpensesSystem (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdCategoryId: number;
  let createdExpenseId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  // --- Categories ---

  it('/expenses/categories (POST) - Create Category', async () => {
    const uniqueName = `E2E Category ${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/expenses/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: uniqueName })
      .expect(201); // Or 200 depending on implementation

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(uniqueName);
    createdCategoryId = response.body.id;
  });

  it('/expenses/categories (GET) - List Categories', async () => {
    const response = await request(app.getHttpServer())
      .get('/expenses/categories')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const cat = response.body.find(c => c.id === createdCategoryId);
    expect(cat).toBeDefined();
  });

  // --- Expenses ---

  it('/expenses (POST) - Create Expense', async () => {
    const response = await request(app.getHttpServer())
      .post('/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 500,
        categoryId: createdCategoryId,
        description: 'Test Expense',
        date: new Date().toISOString()
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(Number(response.body.amount)).toBe(500);
    createdExpenseId = response.body.id;
  });

  it('/expenses (GET) - List Expenses', async () => {
    const response = await request(app.getHttpServer())
      .get('/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const expense = response.body.find(e => e.id === createdExpenseId);
    expect(expense).toBeDefined();
  });

  it('/expenses (GET) - Filter Expenses by Category', async () => {
    const response = await request(app.getHttpServer())
      .get(`/expenses?categoryId=${createdCategoryId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    // Should be at least one (the one we created)
    expect(response.body.some(e => e.id === createdExpenseId)).toBe(true);
  });

  it('/expenses/:id (PATCH) - Update Expense', async () => {
    const response = await request(app.getHttpServer())
        .patch(`/expenses/${createdExpenseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 600 })
        .expect(200);
    
    expect(Number(response.body.amount)).toBe(600);
  });

  it('/expenses/:id (DELETE) - Delete Expense', async () => {
    await request(app.getHttpServer())
      .delete(`/expenses/${createdExpenseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const response = await request(app.getHttpServer())
      .get('/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    const expense = response.body.find(e => e.id === createdExpenseId);
    expect(expense).toBeUndefined();
  });
});
