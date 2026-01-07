-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('ENQUIRED', 'CONFIRMED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('CONFIRMED', 'IN_PRODUCTION', 'READY', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'FULLY_PAID');

-- AlterTable: Add new columns first
ALTER TABLE "orders" ADD COLUMN "delivery_status" "DeliveryStatus";
ALTER TABLE "orders" ADD COLUMN "payment_status" "PaymentStatus";
ALTER TABLE "order_items" ADD COLUMN "status" "ItemStatus" NOT NULL DEFAULT 'CONFIRMED';


-- Data Migration: Populate columns based on old string status
-- 1. Set Item Status to DELIVERED if order was 'delivered'
UPDATE "order_items" 
SET "status" = 'DELIVERED' 
FROM "orders" 
WHERE "order_items"."order_id" = "orders"."id" AND "orders"."status" = 'delivered';

-- 2. Set Item Status to READY if order was 'ready' (optional, assumes all items ready)
UPDATE "order_items" 
SET "status" = 'READY' 
FROM "orders" 
WHERE "order_items"."order_id" = "orders"."id" AND "orders"."status" = 'ready';

-- 3. Set Item Status to IN_PRODUCTION if order was 'production'
UPDATE "order_items" 
SET "status" = 'IN_PRODUCTION' 
FROM "orders" 
WHERE "order_items"."order_id" = "orders"."id" AND "orders"."status" = 'production';

-- 4. Set Order Delivery Status
UPDATE "orders" SET "delivery_status" = 'FULLY_DELIVERED' WHERE "status" = 'delivered';
UPDATE "orders" SET "delivery_status" = 'READY' WHERE "status" = 'ready';
UPDATE "orders" SET "delivery_status" = 'IN_PRODUCTION' WHERE "status" = 'production';
UPDATE "orders" SET "delivery_status" = 'CONFIRMED' WHERE "delivery_status" IS NULL;

-- 5. Set Payment Status (Naive default, refined by code later)
UPDATE "orders" SET "payment_status" = 'UNPAID'; 

-- 6. Alter Order Status Column with Casting
-- Drop old default first to prevent casting error
ALTER TABLE "orders" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "orders" 
ALTER COLUMN "status" TYPE "OrderStatus" 
USING (
  CASE 
    WHEN "status" = 'delivered' THEN 'CONFIRMED'::"OrderStatus" -- Delivered is active state unless paid. Confirmed covers it.
    WHEN "status" = 'ready' THEN 'CONFIRMED'::"OrderStatus"
    WHEN "status" = 'production' THEN 'CONFIRMED'::"OrderStatus"
    WHEN "status" IN ('confirmed', 'enquired', 'closed', 'cancelled') THEN UPPER("status")::"OrderStatus"
    ELSE 'CONFIRMED'::"OrderStatus" 
  END
);

-- Set Default
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

