-- CreateTable
CREATE TABLE "contact_phones" (
    "id" SERIAL NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'mobile',

    CONSTRAINT "contact_phones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contact_phones" ADD CONSTRAINT "contact_phones_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
