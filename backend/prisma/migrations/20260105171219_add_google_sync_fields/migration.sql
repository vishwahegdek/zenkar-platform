-- AlterTable
ALTER TABLE "users" ADD COLUMN     "google_refresh_token" TEXT,
ADD COLUMN     "last_sync_at" TIMESTAMP(3);
