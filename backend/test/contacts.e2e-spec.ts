
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ContactsSystem (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdContactId: number;

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

  it('/contacts (POST) - Create Contact Success', async () => {
    const response = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Supplier',
        phone: '9876543210',
        group: 'Suppliers'
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Supplier');
    createdContactId = response.body.id;
  });

  it('/contacts (POST) - Create Contact Fail (Missing Name)', async () => {
    await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        phone: '9876543210'
      })
      .expect(400); // ValidationPipe should catch this
  });

  it('/contacts (GET) - List Contacts', async () => {
    const response = await request(app.getHttpServer())
      .get('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    const contact = response.body.find(c => c.id === createdContactId);
    expect(contact).toBeDefined();
    expect(contact.name).toBe('Test Supplier');
  });

  it('/contacts/:id (PATCH) - Update Contact', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/contacts/${createdContactId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Supplier'
      })
      .expect(200);

    expect(response.body.name).toBe('Updated Supplier');
  });

  it('/contacts/:id (DELETE) - Delete Contact', async () => {
    await request(app.getHttpServer())
      .delete(`/contacts/${createdContactId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify deletion
    const response = await request(app.getHttpServer())
      .get('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
      
    const contact = response.body.find(c => c.id === createdContactId);
    expect(contact).toBeUndefined();
  });
});
