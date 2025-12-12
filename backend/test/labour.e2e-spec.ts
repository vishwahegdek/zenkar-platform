
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('LabourSystem (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdLabourerId: number;

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

  it('/labour (POST) - Create Labourer', async () => {
    const response = await request(app.getHttpServer())
      .post('/labour')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Ramesh Helper',
        defaultDailyWage: 500
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Ramesh Helper');
    createdLabourerId = response.body.id;
  });

  it('/labour/daily (GET) - Get Daily View (Today)', async () => {
    const response = await request(app.getHttpServer())
      .get('/labour/daily')
      .query({ date: new Date().toISOString() })
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    // createdLabourerId might be in the list, though attendance might be empty
    const labourer = response.body.find(l => l.id === createdLabourerId);
    expect(labourer).toBeDefined();
  });

  it('/labour/daily (POST) - Update Daily View (Attendance)', async () => {
    const today = new Date().toISOString();
    const response = await request(app.getHttpServer())
      .post('/labour/daily')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        date: today,
        updates: [
          {
            labourerId: createdLabourerId,
            isPresent: true,
            wage: 500,
            paid: 0,
            notes: 'Present'
          }
        ]
      })
      .expect(201);
      
    // Returns status typically, checking 201 is enough for E2E
  });

  it('/labour/report (GET) - Get Report', async () => {
    const response = await request(app.getHttpServer())
      .get('/labour/report')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Report should show list of labourers with summaries
    expect(Array.isArray(response.body)).toBe(true);
    const labourer = response.body.find(l => l.id === createdLabourerId);
    expect(labourer).toBeDefined();
  });

  it('/labour/:id (POST) - Update Labourer', async () => {
    const response = await request(app.getHttpServer())
      .post(`/labour/${createdLabourerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Ramesh Updated',
        defaultDailyWage: 600
      })
      .expect(201); // Controller uses POST for update

      expect(response.body.name).toBe('Ramesh Updated');
      expect(Number(response.body.defaultDailyWage)).toBe(600);
  });

  it('/labour/:id (DELETE) - Delete Labourer', async () => {
    await request(app.getHttpServer())
      .delete(`/labour/${createdLabourerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    // Verify deletion from findAll/Report
    const response = await request(app.getHttpServer())
      .get('/labour/report')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
      
    const labourer = response.body.find(l => l.id === createdLabourerId);
    expect(labourer).toBeUndefined();
  });
});
