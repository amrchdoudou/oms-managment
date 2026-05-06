import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

async function testApi() {
  const urlDb = process.env.DATABASE_URL;
  if (!urlDb) return;
  const prisma = new PrismaClient({ datasources: { db: { url: urlDb.includes('pgbouncer') ? urlDb : urlDb + '?pgbouncer=true' } } });
  const MathValue = await prisma.setting.findUnique({ where: { key: 'api_keys' } });
  const token = ((MathValue?.value as any)?.ecotrack_token || '').replace('Bearer ', '');
  const url = ((MathValue?.value as any)?.ecotrack_url || '').replace(/\/api\/.*$/, '');
  
  const endpoints = ['/api/v1/get/profile', '/api/v1/get/stores', '/api/v1/get/centers', '/api/v1/get/users'];
  for (const end of endpoints) {
      const response = await fetch(`${url}${end}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      console.log(end, response.status, await response.text());
  }
}
testApi();
