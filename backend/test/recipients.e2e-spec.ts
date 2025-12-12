
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('RecipientsSystem (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

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

  it('/recipients (GET) - Search Recipients', async () => {
    // Recipients are likely Contacts or people who received expenses.
    // We can just check that the endpoint responds 200 and matches structure.
    const response = await request(app.getHttpServer())
      .get('/recipients')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
  
  it('/recipients (GET) - Search Query', async () => {
    const response = await request(app.getHttpServer())
      .get('/recipients?query=Test')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
      
    expect(Array.isArray(response.body)).toBe(true);
  });
});
