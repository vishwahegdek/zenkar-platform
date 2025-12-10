
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = 'admin';
  const adminPassword = 'admin123'; // Change this in production!

  const existingUser = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingUser) {
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    await prisma.user.create({
      data: {
        username: adminUsername,
        password: passwordHash,
      },
    });
    console.log(`Created user: ${adminUsername}`);
  } else {
    console.log(`User ${adminUsername} already exists.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
