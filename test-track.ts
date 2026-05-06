import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

async function testTrack() {
  const urlDb = process.env.DATABASE_URL;
  if (!urlDb) return;
  const prisma = new PrismaClient({ datasources: { db: { url: urlDb.includes('pgbouncer') ? urlDb : urlDb + '?pgbouncer=true' } } });
  const MathValue = await prisma.setting.findUnique({ where: { key: 'api_keys' } });
  const token = ((MathValue?.value as any)?.ecotrack_token || '').replace('Bearer ', '');
  const url = ((MathValue?.value as any)?.ecotrack_url || '').replace(/\/api\/.*$/, '');
  
  const response = await fetch(`${url}/api/v1/get/orders/status?api_token=${token}&trackings=DHDO6X326050612857629&status=all`, {
      headers: { 'Accept': 'application/json' }
  });
  console.log(response.status, await response.text());
}
testTrack();
