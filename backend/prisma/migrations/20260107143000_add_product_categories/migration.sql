-- CreateTable
CREATE TABLE "product_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories"("name");

-- Data Migration: Seed Initial Categories
INSERT INTO "product_categories" ("name") VALUES ('Bee boxes');
INSERT INTO "product_categories" ("name") VALUES ('General');

-- AlterTable: Add category_id column (Nullable initially)
ALTER TABLE "products" ADD COLUMN "category_id" INTEGER;

-- Data Migration: Backfill existing products
-- Strategy: If name contains 'Box' or 'Frame' -> 'Bee boxes', else -> 'General' (or just default all to 'General' then let user fix? 
-- User requirement said "Bee boxes" is default. Let's make 'Bee boxes' ID 1.
WITH bee_boxes AS (SELECT id FROM "product_categories" WHERE name = 'Bee boxes')
UPDATE "products" SET "category_id" = (SELECT id FROM bee_boxes);

-- AlterTable: Make category_id required
ALTER TABLE "products" ALTER COLUMN "category_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
