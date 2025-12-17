-- CreateTable
CREATE TABLE "labour_settlements" (
    "id" SERIAL NOT NULL,
    "labourer_id" INTEGER NOT NULL,
    "settlement_date" DATE NOT NULL,
    "total_attendance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_payable" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labour_settlements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "labour_settlements" ADD CONSTRAINT "labour_settlements_labourer_id_fkey" FOREIGN KEY ("labourer_id") REFERENCES "labourers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
