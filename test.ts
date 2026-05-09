import { PrismaClient } from '@prisma/client';

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  console.log('DATABASE_URL:', dbUrl);

  const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });
  
  try {
    const start = Date.now();
    console.log('Testing queryRaw...');
    await prisma.$queryRaw`SELECT 1`;
    console.log(`queryRaw passed in ${Date.now() - start}ms`);

    console.log('Testing user count...');
    const c = await prisma.user.count();
    console.log(`count passed: ${c}`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
