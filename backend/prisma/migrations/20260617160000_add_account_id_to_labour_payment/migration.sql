-- AlterTable
ALTER TABLE "labour_payments" ADD COLUMN     "account_id" INTEGER;

-- AddForeignKey
ALTER TABLE "labour_payments" ADD CONSTRAINT "labour_payments_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "ledger_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
