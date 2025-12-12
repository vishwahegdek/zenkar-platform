# Schema Deployed Changes
**Previous Version**: `v1.4.1`
**Comparison**: `v1.4.1` vs `v1.5.0`

## Changes Analysis
The following changes have been applied since the last deployment (`v1.4.1`). These reflect the new features for **Auditing**, **Contact/User Relations**, and **Labour Module**.

### 1. User Model (`User`)
- **New Relations**:
    - `contacts`: User can now own contacts.
    - `labourers`: Relation to Labourer model.
    - `recipients`: Relation to Recipient model.
    - `auditLogs`: Relation to new AuditLog model.
    - **Auditing Relations**: Added inverse relations for `createdOrders`, `updatedOrders`, `createdPayments`, `updatedPayments`, `createdExpenses`, `updatedExpenszes`, `createdProducts`, `updatedProducts`.

### 2. Customer Model (`Customer`)
- **New Fields**:
    - `contactId` (Int?): Link to a generic Contact.
    - `contact` (Relation): Relation to `Contact` model.

### 3. Product Model (`Product`)
- **Auditing**: Added `createdById`, `updatedById` and relations to `User`.

### 4. Order Model (`Order`)
- **Auditing**: Added `createdById`, `updatedById` and relations to `User`.

### 5. Payment Model (`Payment`)
- **Auditing**: Added `createdById`, `updatedById` and relations to `User`.

### 6. Expense Model (`Expense`)
- **New Fields**:
    - `recipientLinkId` (Int?): Explicit link to `Recipient` model.
    - `labourerId` (Int?): Link to `Labourer`.
- **Auditing**: Added `createdById`, `updatedById` and relations to `User`.

### 7. New Models
- **`AuditLog`**: Stores history of actions (action, resource, details, userId).
- **`ExpenseCategory`**: Categorization for expenses.
- **`Contact`**: Generic contact management.
- **`Recipient`**: Payee/Recipient management.
- **`Labourer`**: Labour management entity.
- **`Attendance`**: Daily attendance tracking for labourers.

## Full Diff
```diff
--- backend/prisma/schema.v1.4.1.prisma
+++ backend/prisma/schema.prisma
@@ -18,6 +18,19 @@
   createdAt DateTime @default(now()) @map("created_at")
   
   customers Customer[]
+  contacts  Contact[] // Relation - user can own contacts
+  labourers Labourer[]
+  recipients Recipient[]
+  auditLogs AuditLog[]
+
+  createdOrders   Order[]   @relation("OrderCreatedBy")
+  updatedOrders   Order[]   @relation("OrderUpdatedBy")
+  createdPayments Payment[] @relation("PaymentCreatedBy")
+  updatedPayments Payment[] @relation("PaymentUpdatedBy")
+  createdExpenses Expense[] @relation("ExpenseCreatedBy")
+  updatedExpenses Expense[] @relation("ExpenseUpdatedBy")
+  createdProducts Product[] @relation("ProductCreatedBy")
+  updatedProducts Product[] @relation("ProductUpdatedBy")
 
   @@map("users")
 }
@@ -29,7 +42,9 @@
   address   String?
   createdAt DateTime @default(now()) @map("created_at")
   userId    Int?     @map("user_id")
+  contactId Int?     @map("contact_id") // Optional link to Contact
   user      User?    @relation(fields: [userId], references: [id])
+  contact   Contact? @relation(fields: [contactId], references: [id])
   orders    Order[]
 
   @@map("customers")
@@ -57,6 +72,11 @@
   name             String
   defaultUnitPrice Decimal     @default(0) @map("default_unit_price") @db.Decimal(10, 2)
   notes            String?
+
+  createdById Int?     @map("created_by_id")
+  updatedById Int?     @map("updated_by_id")
+  createdBy   User?    @relation("ProductCreatedBy", fields: [createdById], references: [id])
+  updatedBy   User?    @relation("ProductUpdatedBy", fields: [updatedById], references: [id])
   images           Image[]
   createdAt        DateTime    @default(now()) @map("created_at")
   isDeleted        Boolean     @default(false) @map("is_deleted")
@@ -88,6 +108,11 @@
   items         OrderItem[]
   payments      Payment[]
 
+  createdById   Int?      @map("created_by_id")
+  updatedById   Int?      @map("updated_by_id")
+  createdBy     User?     @relation("OrderCreatedBy", fields: [createdById], references: [id])
+  updatedBy     User?     @relation("OrderUpdatedBy", fields: [updatedById], references: [id])
+
   @@map("orders")
 }
 
@@ -101,6 +126,11 @@
   
   order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
 
+  createdById Int?     @map("created_by_id")
+  updatedById Int?     @map("updated_by_id")
+  createdBy   User?    @relation("PaymentCreatedBy", fields: [createdById], references: [id])
+  updatedBy   User?    @relation("PaymentUpdatedBy", fields: [updatedById], references: [id])
+
   @@map("payments")
 }
 
@@ -121,3 +151,113 @@
   @@map("order_items")
 }
 
+
+model AuditLog {
+  id         Int      @id @default(autoincrement())
+  userId     Int?     @map("user_id")
+  action     String   // CREATE, UPDATE, DELETE
+  resource   String   // Order, Product, Customer
+  resourceId String   // ID of the resource (stored as string for flexibility)
+  details    Json?    // Stores the changes or snapshot
+  createdAt  DateTime @default(now()) @map("created_at")
+
+  user       User?    @relation(fields: [userId], references: [id])
+
+
+  @@map("audit_logs")
+}
+
+
+
+model ExpenseCategory {
+  id    Int    @id @default(autoincrement())
+  name  String @unique
+  
+  expenses Expense[]
+
+  @@map("expense_categories")
+}
+
+
+model Contact {
+  id        Int      @id @default(autoincrement())
+  userId    Int?     @map("user_id") 
+  name      String
+  phone     String?
+  group     String?  
+  createdAt DateTime @default(now()) @map("created_at")
+
+  user      User?    @relation(fields: [userId], references: [id])
+  customers Customer[]
+  recipients Recipient[]
+
+  @@map("contacts")
+}
+
+model Recipient {
+  id        Int      @id @default(autoincrement())
+  contactId Int?     @map("contact_id")
+  userId    Int?     @map("user_id") 
+  name      String   // Recipient Name (derived from contact or custom)
+  createdAt DateTime @default(now()) @map("created_at")
+
+  contact   Contact? @relation(fields: [contactId], references: [id])
+  user      User?    @relation(fields: [userId], references: [id])
+  expenses  Expense[]
+
+  @@unique([userId, contactId, name]) // Flexible uniqueness
+  @@map("recipients")
+}
+
+model Labourer {
+  id        Int      @id @default(autoincrement())
+  userId    Int?     @map("user_id")
+  name      String
+  defaultDailyWage Decimal? @map("default_daily_wage") @db.Decimal(12, 2)
+  isDeleted Boolean  @default(false) @map("is_deleted")
+  createdAt DateTime @default(now()) @map("created_at")
+
+  user      User?    @relation(fields: [userId], references: [id])
+  attendance Attendance[]
+  expenses   Expense[]
+
+  @@map("labourers")
+}
+
+model Attendance {
+  id        Int      @id @default(autoincrement())
+  labourerId Int     @map("labourer_id")
+  date      DateTime @db.Date
+  value     Decimal  @db.Decimal(3, 1) // 0.5 or 1.0
+  createdAt DateTime @default(now()) @map("created_at")
+
+  labourer  Labourer @relation(fields: [labourerId], references: [id])
+
+  @@unique([labourerId, date])
+  @@map("attendance")
+}
+
+model Expense {
+  id          Int      @id @default(autoincrement())
+  categoryId  Int      @map("category_id")
+  recipientId Int?     @map("recipient_id") // Old: Link to Contact
+  labourerId  Int?     @map("labourer_id")  // Link to Labourer
+  
+  recipientLinkId Int? @map("recipient_link_id") // New: Link to Recipient
+
+  amount      Decimal  @db.Decimal(12, 2)
+  date        DateTime @db.Date // Changed to date only
+  description String?
+  createdAt   DateTime @default(now()) @map("created_at")
+
+  category    ExpenseCategory @relation(fields: [categoryId], references: [id])
+  recipient   Recipient?      @relation(fields: [recipientId], references: [id])
+  labourer    Labourer?       @relation(fields: [labourerId], references: [id])
+  
+  createdById Int?     @map("created_by_id")
+  updatedById Int?     @map("updated_by_id")
+  createdBy   User?    @relation("ExpenseCreatedBy", fields: [createdById], references: [id])
+  updatedBy   User?    @relation("ExpenseUpdatedBy", fields: [updatedById], references: [id])
+  
+  @@map("expenses")
+}
+```
