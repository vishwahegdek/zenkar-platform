
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CustomersSystem (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    // Login to get token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });
      
    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /customers', () => {
    it('should return paginated result structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify new structure
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('total');
    });

    it('should accept pagination params', async () => {
        const response = await request(app.getHttpServer())
          .get('/customers?page=1&limit=5')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
          
        expect(response.body.data.length).toBeLessThanOrEqual(5);
        expect(Number(response.body.meta.page)).toBe(1);
    });
  });
});
