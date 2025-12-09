-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "key_raw" TEXT NOT NULL,
    "key_optimized" TEXT NOT NULL,
    "key_thumbnail" TEXT NOT NULL,
    "product_id" INTEGER,
    "order_item_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "products" DROP COLUMN "sku",
ADD COLUMN "deleted_at" TIMESTAMP(3),
ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "images_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
