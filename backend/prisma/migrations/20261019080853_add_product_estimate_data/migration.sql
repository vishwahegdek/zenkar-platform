-- AlterTable
ALTER TABLE "products" ADD COLUMN     "estimate_data" JSONB,
ADD COLUMN     "saved_estimate_id" INTEGER;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_saved_estimate_id_fkey" FOREIGN KEY ("saved_estimate_id") REFERENCES "saved_estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
