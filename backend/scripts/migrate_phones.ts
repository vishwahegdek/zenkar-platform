
import { PrismaClient } from '@prisma/client';
import { parsePhoneNumber } from 'libphonenumber-js';

const prisma = new PrismaClient();

async function main() {
  const contacts = await prisma.contact.findMany({
    where: {
      phone: {
        not: null,
      },
      isDeleted: false,
    },
  });

  console.log(`Found ${contacts.length} contacts with phone numbers.`);

  let success = 0;
  let failed = 0;

  for (const contact of contacts) {
    if (!contact.phone) continue;

    try {
      // Defaulting to IN (India) as per user context (+91)
      const phoneNumber = parsePhoneNumber(contact.phone, 'IN');
      
      if (phoneNumber && phoneNumber.isValid()) {
        const e164 = phoneNumber.format('E.164');
        
        // Create ContactPhone entry
        await prisma.contactPhone.create({
          data: {
            contactId: contact.id,
            phone: e164,
            type: 'mobile', 
          },
        });
        
        // Optional: clear old phone field? 
        // For safety, let's keep it nullified to indicate migrated.
        // Or keep it as fallback? Plan says "Nullify old phone column".
        await prisma.contact.update({
            where: { id: contact.id },
            data: { phone: null }
        });

        success++;
      } else {
        console.warn(`Invalid phone for contact ${contact.id} (${contact.name}): ${contact.phone}`);
        
        // Force migration even if invalid? 
        // User said "Non-negotiable E.164".
        // If we can't format it to E.164, we can't save it to our new strict schema (if we enforced it).
        // But our schema is just String.
        // However, let's just attempt to save as is if it fails parsing?
        // Actually, if it fails parsing, let's NOT migrate clearly but Log it.
        // Wait, if we don't migrate, we lose it when we switch UI to read from new table.
        // Let's migrate as-is into the new table but warn.
        
        await prisma.contactPhone.create({
            data: {
              contactId: contact.id,
              phone: contact.phone, // Store raw if invalid
              type: 'unknown', 
            },
          });
          
        await prisma.contact.update({
            where: { id: contact.id },
            data: { phone: null }
        });
        
        failed++;
      }
    } catch (e) {
      console.error(`Error processing contact ${contact.id}: ${e.message}`);
      
      // Fallback: Just move it raw
      await prisma.contactPhone.create({
        data: {
          contactId: contact.id,
          phone: contact.phone, 
          type: 'unknown', 
        },
      });
      
      await prisma.contact.update({
        where: { id: contact.id },
        data: { phone: null }
      });
      
      failed++;
    }
  }

  console.log(`Migration complete. Success: ${success}. Warnings/Raw: ${failed}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
