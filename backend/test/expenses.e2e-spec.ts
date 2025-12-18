
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

  it('/expenses (GET) - Filter by specific date', async () => {
    // 1. Create expense today
    const today = new Date().toISOString().split('T')[0];
    const prevDay = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    await request(app.getHttpServer())
      .post('/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 100, categoryId: createdCategoryId, date: today })
      .expect(201);
    
    // 2. Fetch today
    const resToday = await request(app.getHttpServer())
        .get(`/expenses?date=${today}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    expect(resToday.body.length).toBeGreaterThanOrEqual(1);

    // 3. Fetch prev day (should be empty given we made none or if strictly filtered)
    // Note: Use a random past date to ensure empty
    const oldDate = '2000-01-01';
    const resOld = await request(app.getHttpServer())
        .get(`/expenses?date=${oldDate}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    expect(resOld.body.length).toBe(0);
  });

  // --- Search & Advanced Scenarios ---

  it('/expenses (GET) - Search by Description', async () => {
    // 1. Create unique expense
    const uniqueDesc = `UniqueDesc${Date.now()}`;
    await request(app.getHttpServer())
      .post('/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 100, categoryId: createdCategoryId, description: uniqueDesc })
      .expect(201);

    // 2. Search
    const response = await request(app.getHttpServer())
      .get(`/expenses?search=${uniqueDesc}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0].description).toBe(uniqueDesc);
  });

  it('/expenses (POST) - Create with Recipient Resolution', async () => {
    const recipientName = `NewRecipient_${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 200, 
        categoryId: createdCategoryId, 
        recipientName: recipientName // Should auto-create
      })
      .expect(201);
    
    expect(response.body.recipientId).toBeDefined();
    // Verify recipient created
    const recId = response.body.recipientId;
    // We can't access RecipientsService directly here easily without e2e for it, but we can verify expense has it.
    expect(response.body.recipient).toBeDefined(); // include: recipient: true
    expect(response.body.recipient.name).toBe(recipientName);
  });

  it('/expenses/:id (PATCH) - Update with Recipient Resolution', async () => {
    // Create basic expense
    const createRes = await request(app.getHttpServer())
      .post('/expenses')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ amount: 300, categoryId: createdCategoryId })
      .expect(201);
    const expId = createRes.body.id;

    // Update with new recipient name
    const newRecName = `UpdatedRec_${Date.now()}`;
    const updateRes = await request(app.getHttpServer())
        .patch(`/expenses/${expId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ recipientName: newRecName })
        .expect(200);
    
    expect(updateRes.body.recipient).toBeDefined();
    expect(updateRes.body.recipient.name).toBe(newRecName);
  });

  it('/expenses/:id (GET) - Find One', async () => {
      const response = await request(app.getHttpServer())
        .get(`/expenses/${createdExpenseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.id).toBe(createdExpenseId);
      expect(response.body.category).toBeDefined();
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
