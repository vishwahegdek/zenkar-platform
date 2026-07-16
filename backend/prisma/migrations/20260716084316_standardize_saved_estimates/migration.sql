-- DropForeignKey
ALTER TABLE IF EXISTS "finance_parties" DROP CONSTRAINT IF EXISTS "finance_parties_contact_id_fkey";
ALTER TABLE IF EXISTS "finance_parties" DROP CONSTRAINT IF EXISTS "finance_parties_user_id_fkey";
ALTER TABLE IF EXISTS "finance_transactions" DROP CONSTRAINT IF EXISTS "finance_transactions_finance_party_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "finance_parties";
DROP TABLE IF EXISTS "finance_transactions";

-- CreateTable
CREATE TABLE IF NOT EXISTS "wood_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isSeeded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wood_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "saved_estimates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "total_cost" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_estimates_pkey" PRIMARY KEY ("id")
);

-- Handle created_by to created_by_id logic manually to prevent crashing if it already exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_estimates' AND column_name='created_by') THEN
        ALTER TABLE "saved_estimates" DROP COLUMN "created_by";
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saved_estimates' AND column_name='created_by_id') THEN
        ALTER TABLE "saved_estimates" ADD COLUMN "created_by_id" INTEGER;
        ALTER TABLE "saved_estimates" ADD CONSTRAINT "saved_estimates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

