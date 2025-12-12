/*
  Warnings:

  - You are about to drop the column `advance_amount` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "google_id" TEXT;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "advance_amount";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
