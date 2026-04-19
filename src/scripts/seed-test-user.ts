import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'admin';
  const plainPassword = 'admin1234';
  
  console.log(`Creating test user: ${username}...`);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  try {
    const user = await prisma.user.upsert({
      where: { username },
      update: {
        password: hashedPassword,
        role: 'OWNER',
      },
      create: {
        username,
        password: hashedPassword,
        role: 'OWNER',
        storageQuota: 0, // Ilimitado
      }
    });

    console.log('✅ Test user created/updated successfully:', user.username);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
