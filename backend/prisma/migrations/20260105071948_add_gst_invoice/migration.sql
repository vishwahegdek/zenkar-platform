-- CreateTable
CREATE TABLE "gst_invoices" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gst_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gst_invoices_order_id_key" ON "gst_invoices"("order_id");

-- AddForeignKey
ALTER TABLE "gst_invoices" ADD CONSTRAINT "gst_invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
