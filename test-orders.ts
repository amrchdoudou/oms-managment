import { PrismaClient } from '@prisma/client';

async function testConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('No DATABASE_URL');
    return;
  }
  let dbUrl = url;
  if (!dbUrl.includes('pgbouncer=true')) {
    dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });
  
  try {
    const orders = await prisma.order.findMany();
    console.log(orders.map(o => ({ id: o.id, wilaya: o.wilaya, commune: o.commune, stop_desk: o.stop_desk })));
  } catch (err: any) {
    console.error('Connection failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
