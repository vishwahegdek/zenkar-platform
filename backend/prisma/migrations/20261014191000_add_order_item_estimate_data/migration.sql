-- AlterTable: Add estimate_data and saved_estimate_id to order_items
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='estimate_data') THEN
        ALTER TABLE "order_items" ADD COLUMN "estimate_data" JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='order_items' AND column_name='saved_estimate_id') THEN
        ALTER TABLE "order_items" ADD COLUMN "saved_estimate_id" INTEGER;
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_saved_estimate_id_fkey" FOREIGN KEY ("saved_estimate_id") REFERENCES "saved_estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
