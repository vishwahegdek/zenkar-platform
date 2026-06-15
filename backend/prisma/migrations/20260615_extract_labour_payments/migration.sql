-- CreateTable
CREATE TABLE "labour_payments" (
    "id" SERIAL NOT NULL,
    "labourer_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,

    CONSTRAINT "labour_payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "labour_payments" ADD CONSTRAINT "labour_payments_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labour_payments" ADD CONSTRAINT "labour_payments_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labour_payments" ADD CONSTRAINT "labour_payments_labourer_id_fkey" FOREIGN KEY ("labourer_id") REFERENCES "labourers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Migrate Data from expenses to labour_payments
INSERT INTO "labour_payments" ("labourer_id", "amount", "date", "note", "method", "created_at", "updated_at", "created_by_id", "updated_by_id")
SELECT "labourer_id", "amount", "date", "description", "method", "created_at", "updated_at", "created_by_id", "updated_by_id"
FROM "expenses"
WHERE "labourer_id" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_labourer_id_fkey";

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "labourer_id";
