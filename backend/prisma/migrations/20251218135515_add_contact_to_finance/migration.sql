-- AlterTable
ALTER TABLE "finance_parties" ADD COLUMN     "contact_id" INTEGER;

-- AddForeignKey
ALTER TABLE "finance_parties" ADD CONSTRAINT "finance_parties_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
