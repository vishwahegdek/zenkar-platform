-- CreateTable
CREATE TABLE "creditors" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creditors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creditor_transactions" (
    "id" SERIAL NOT NULL,
    "creditor_id" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creditor_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "creditors" ADD CONSTRAINT "creditors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creditor_transactions" ADD CONSTRAINT "creditor_transactions_creditor_id_fkey" FOREIGN KEY ("creditor_id") REFERENCES "creditors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
