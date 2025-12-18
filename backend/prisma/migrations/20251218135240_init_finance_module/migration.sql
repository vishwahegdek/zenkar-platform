/*
  Warnings:

  - You are about to drop the `creditor_transactions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `creditors` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "creditor_transactions" DROP CONSTRAINT "creditor_transactions_creditor_id_fkey";

-- DropForeignKey
ALTER TABLE "creditors" DROP CONSTRAINT "creditors_user_id_fkey";

-- DropTable
DROP TABLE "creditor_transactions";

-- DropTable
DROP TABLE "creditors";

-- CreateTable
CREATE TABLE "finance_parties" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CREDITOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_transactions" (
    "id" SERIAL NOT NULL,
    "finance_party_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "finance_parties" ADD CONSTRAINT "finance_parties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_finance_party_id_fkey" FOREIGN KEY ("finance_party_id") REFERENCES "finance_parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
