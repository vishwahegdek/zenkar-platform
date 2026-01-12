import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Inventory Flow (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let productId: number;
  let supplierId: number;
  let customerContactId: number;
  let purchaseId: number;
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

    // Login for token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    authToken = loginRes.body.access_token;
    
    // Mock Google Token for Contacts Service
    const prisma = app.get(PrismaService);
    await prisma.user.update({
        where: { username: 'admin' },
        data: { googleRefreshToken: 'MOCK_TOKEN' }
    });
  });

  afterAll(async () => {
    // Cleanup Code Here
    if (productId) {
         // Hard Delete maybe? Or just leave it as Soft Delete works
         // await app.get(PrismaService).product.delete({ where: { id: productId }});
    }
    await app.close();
  });

  it('1. Create Inventory Tracked Product', async () => {
    // 1. Create Category first (or use existing)
    const catRes = await request(app.getHttpServer())
        .get('/product-categories')
        .set('Authorization', `Bearer ${authToken}`);
    
    let categoryId = catRes.body[0]?.id;
    if (!categoryId) {
        const newCat = await request(app.getHttpServer())
            .post('/product-categories')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'Test Cat' });
        categoryId = newCat.body.id;
    }

    const res = await request(app.getHttpServer())
      .post('/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Inventory Tracked Item ' + Date.now(),
        defaultUnitPrice: 100,
        categoryId: categoryId,
        isInventoryTracked: true
      })
      .expect(201);
    
    expect(res.body.isInventoryTracked).toBe(true);
    expect(res.body.stockQuantity).toBe(0);
    productId = res.body.id;
  });

  it('2. Create Purchase (Stock IN)', async () => {
    // Create Supplier Contact
    const contactRes = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Inventory Supplier', phone: '9999911111' })
      .expect(201);
    supplierId = contactRes.body.id;

    // Create Purchase
    const purchaseRes = await request(app.getHttpServer())
      .post('/purchases')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        supplierId,
        purchaseDate: new Date().toISOString(),
        invoiceNo: 'INV-TEST-001',
        items: [
            { productId, quantity: 10, unitCost: 50 }
        ]
      })
      .expect(201);
    
    purchaseId = purchaseRes.body.id;

    // Verify Stock Updated
    const productRes = await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(productRes.body.stockQuantity).toBe(10);
  });

  it('3. Create Order (No Stock Deduct initially)', async () => {
    // Create Customer Contact
    const contactRes = await request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Inventory Customer', phone: '8888822222' })
      .expect(201);
    customerContactId = contactRes.body.id;

    const orderRes = await request(app.getHttpServer())
       .post('/orders')
       .set('Authorization', `Bearer ${authToken}`)
       .send({
         contactId: customerContactId,
         items: [
             { productId, quantity: 3, unitPrice: 150, lineTotal: 450 }
         ],
         totalAmount: 450,
         paymentMethod: 'CASH'
       })
       .expect(201);
    
    orderId = orderRes.body.id;
    // Stock should seemingly NOT change on Create (Status is usually Confirmed)
    // Verify Stock
     const productRes = await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(productRes.body.stockQuantity).toBe(10);
  });

  it('4. Deliver Order (Stock Out)', async () => {
    // Update Order Status to DELIVERED
    // Note: My implementation handles this in `update` (Order Level) logic.
    await request(app.getHttpServer())
      .patch(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'CLOSED' }) // CLOSED implies Delivered usually, or explicitly use DELIVERED if supported
      // Usually frontend sequence is Delivered -> Closed. But let's try Delivered if enum allows.
      // Schema has DELIVERED. My logic supports 'DELIVERED' or 'CLOSED'.
      // If I set 'CLOSED', it triggers isDelivering.
      .expect(200);
    
    // Verify Stock
    const productRes = await request(app.getHttpServer())
      .get(`/products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(productRes.body.stockQuantity).toBe(7); // 10 - 3 = 7
  });

});
