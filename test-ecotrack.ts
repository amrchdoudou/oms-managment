import { PrismaClient } from '@prisma/client';

async function testEcotrack() {
  const url = process.env.DATABASE_URL;
  if (!url) return;
  let dbUrl = url;
  if (!dbUrl.includes('pgbouncer=true')) {
    dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });
  const apiKeysSetting = await prisma.setting.findUnique({ where: { key: 'api_keys' } });
  const token = (apiKeysSetting?.value as any)?.ecotrack_token;
  let ecotrackBaseUrl = (apiKeysSetting?.value as any)?.ecotrack_url;
  
      const suffixes = ['/api/v1/create/orders', '/api/v1/create/order', '/api/v1/create', '/api/v1', '/create/orders', '/create/order'];
      for (const suffix of suffixes) {
        if ((ecotrackBaseUrl || '').toLowerCase().endsWith(suffix)) {
          ecotrackBaseUrl = ecotrackBaseUrl.slice(0, -suffix.length);
          break;
        }
      }
      ecotrackBaseUrl = ecotrackBaseUrl.replace(/\/+$/, '');
  
  if (!ecotrackBaseUrl) ecotrackBaseUrl = 'https://app.ecotrack.dz';

  const resp2 = await fetch(`${ecotrackBaseUrl}/api/v1/get/orders/status?api_token=${token.startsWith('Bearer ') ? token.substring(7) : token}&trackings=DHDO6X326050612857627&status=all`, {
      headers: { 'Accept': 'application/json' }
  });
  console.log("Check", await resp2.json());
}
testEcotrack();
