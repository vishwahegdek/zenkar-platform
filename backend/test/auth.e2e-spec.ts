
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/login (POST) - Success', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(201);

    expect(response.body.access_token).toBeDefined();
    authToken = response.body.access_token;
  });

  it('/auth/login (POST) - Fail', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'wrong' })
      .expect(401);
  });

  it('/orders (GET) - Fail without token', () => {
    return request(app.getHttpServer())
      .get('/orders')
      .expect(401);
  });

  it('/orders (GET) - Success with token', async () => {
    return request(app.getHttpServer())
      .get('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
