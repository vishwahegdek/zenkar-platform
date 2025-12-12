
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersSystem (e2e)', () => {
  let app: INestApplication;
  // No auth token needed for creation according to some patterns, 
  // but listing usually needs it. Let's check. 
  // Step 79: UsersController doesn't have @UseGuards at class level, 
  // but it's possible methods have it or it's global.
  // Actually Step 79 shows NO guards on UsersController!
  // This might be a security finding, but for now we write tests as is.
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

  it('/users (POST) - Create User', async () => {
    const uniqueName = `user_${Date.now()}`;
    const response = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        username: uniqueName,
        password: 'password123'
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(uniqueName);
    expect(response.body.password).toBeUndefined();
  });

  it('/users (GET) - List Users', async () => {
    const response = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
