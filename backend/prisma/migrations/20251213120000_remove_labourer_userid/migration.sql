-- DropForeignKey
ALTER TABLE "labourers" DROP CONSTRAINT "labourers_user_id_fkey";

-- AlterTable
ALTER TABLE "labourers" DROP COLUMN "user_id";
