import express from 'express';
import 'dotenv/config';
import path from 'path';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import multer from 'multer';

// Prevent Cloudinary initialization crash with invalid URL
if (process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_URL.startsWith('cloudinary://')) {
  console.warn("Invalid CLOUDINARY_URL protocol. URL should begin with 'cloudinary://'. Ignoring CLOUDINARY_URL.");
  delete process.env.CLOUDINARY_URL;
}

// Ensure uploads dir exists in the project root
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Check if Cloudinary is configured
const hasCloudinary = !!process.env.CLOUDINARY_URL || (!!process.env.CLOUDINARY_CLOUD_NAME && !!process.env.CLOUDINARY_API_KEY && !!process.env.CLOUDINARY_API_SECRET);

// Multer for upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadFile = async (file: Express.Multer.File): Promise<string> => {
  if (hasCloudinary) {
    const cloudinaryObj = await import('cloudinary');
    const cloudinary = cloudinaryObj.default?.v2 || cloudinaryObj.v2;

    if (!process.env.CLOUDINARY_URL) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
    }

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "store_products" },
        (error: any, result: any) => {
          if (error) reject(error);
          else resolve(result?.secure_url || '');
        }
      );
      stream.end(file.buffer);
    });
  } else {
    // Fallback to local
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filepath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filepath, file.buffer);
    return '/uploads/' + filename;
  }
};

// Initialize Prisma
let prisma: PrismaClient;

try {
  let dbUrl = process.env.DATABASE_URL?.trim();
  console.log('DEBUG: DATABASE_URL exists:', !!dbUrl);
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.error('DEBUG: Invalid DATABASE_URL:', dbUrl);
    throw new Error('DATABASE_URL must start with postgresql:// or postgres://.');
  }

  if (!dbUrl.includes('pgbouncer=true')) {
    dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
  }

  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
} catch (e: any) {
  // FIXED: 2
  console.error('Failed to initialize Prisma:', e.message);
  prisma = null as any;
}

// Validate at startup
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set.');
}


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // FIXED: 1
  const apiKeyAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path === '/api/health' || 
        (req.path === '/api/orders' && req.method === 'POST') || 
        (req.path === '/api/products' && req.method === 'GET') ||
        (req.path.match(/^\/api\/products\/\d+$/) && req.method === 'GET')) {
      return next();
    }
    
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    const key = req.headers['x-api-key'];
    if (!key || key !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing x-api-key header' });
    }
    next();
  };

  app.use(apiKeyAuth);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Middleware to check database connection
  const checkDb = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!prisma) {
      // FIXED: 2
      return res.status(503).json({ error: 'Database not initialized.' });
    }
    next();
  };

  // ====== STORE CONFIGURATION ROUTES ======

  app.get('/api/settings/store_config', checkDb, async (req, res) => {
    if (!prisma) return res.status(500).json({ error: 'Database not initialized.' });
    try {
      const setting = await prisma.setting.findUnique({ where: { key: 'store_config' } });
      res.json(setting?.value || {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/store_config', checkDb, async (req, res) => {
    if (!prisma) return res.status(500).json({ error: 'Database not initialized.' });
    try {
      await prisma.setting.upsert({
        where: { key: 'store_config' },
        update: { value: req.body },
        create: { key: 'store_config', value: req.body }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ====== TEMPLATE ROUTES ======

  app.get('/api/templates', checkDb, async (req, res) => {
    if (!prisma) return res.status(500).json({ error: 'Database not initialized.' });
    try {
      const type = req.query.type as string | undefined;
      const templates = await prisma.template.findMany({
        where: type ? { type } : {},
        orderBy: { created_at: 'desc' }
      });
      res.json(templates || []);
    } catch (err: any) {
      console.error(err);
      res.status(500).json([]);
    }
  });

  app.get('/api/templates/:id', checkDb, async (req, res) => {
    if (!prisma) return res.status(500).json({ error: 'Database not initialized.' });
    try {
      const template = await prisma.template.findUnique({ where: { id: Number(req.params.id) } });
      if (!template) return res.status(404).json({ error: 'Template not found' });
      res.json(template);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/templates', checkDb, async (req, res) => {
    if (!prisma) return res.status(500).json({ error: 'Database not initialized.' });
    try {
      const { name, type, config } = req.body;
      const template = await prisma.template.create({
        data: { name, type, config }
      });
      res.json({ id: template.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/templates/:id', checkDb, async (req, res) => {
    if (!prisma) return res.status(500).json({ error: 'Database not initialized.' });
    try {
      const { name, config } = req.body;
      await prisma.template.update({
        where: { id: Number(req.params.id) },
        data: { name, config }
      });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/templates/:id', checkDb, async (req, res) => {
    if (!prisma) return res.status(500).json({ error: 'Database not initialized.' });
    try {
      await prisma.template.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ====== API ROUTES ======

  // Helper for safe JSON parsing
  const safeParse = (str: any, fallback: any = []) => {
    if (typeof str !== 'string') return str || fallback;
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  };

  app.get('/api/products', checkDb, async (req, res) => {
    try {
      if (!prisma) return res.json([]);
      const products = await prisma.product.findMany({
        orderBy: { created_at: 'desc' }
      });
      res.json(Array.isArray(products) ? products : []);
    } catch(err: any) {
      console.error('Error fetching products:', err);
      res.json([]);
    }
  });

  app.get('/api/products/:id', checkDb, async (req, res) => {
    try {
      const product = await prisma!.product.findUnique({ where: { id: Number(req.params.id) } });
      if (!product) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.json(product);
    } catch(err: any) {
      console.error(`Error fetching product ${req.params.id}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', checkDb, upload.array('images', 5), async (req, res) => {
    try {
      const { name, description, price, variants, inventory } = req.body;
      let imagePaths: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        imagePaths = await Promise.all(req.files.map(f => uploadFile(f)));
      }

      const product = await prisma!.product.create({
        data: { 
          name, 
          description, 
          price: parseFloat(price) || 0, 
          images: imagePaths, 
          variants: JSON.parse(variants || '[]'), 
          inventory: JSON.parse(inventory || '{}') 
        }
      });
      res.json({ id: product.id });
    } catch(err: any) {
      console.error('Error adding product:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', checkDb, upload.array('images', 5), async (req, res) => {
    try {
      const { name, description, price, variants, inventory, existing_images } = req.body;
      
      let imagePaths: string[] = [];
      if (existing_images) {
        imagePaths = Array.isArray(existing_images) ? existing_images : [existing_images];
      }
      
      if (req.files && Array.isArray(req.files)) {
        const newPaths = await Promise.all(req.files.map(f => uploadFile(f)));
        imagePaths = [...imagePaths, ...newPaths];
      }

      await prisma!.product.update({
        where: { id: Number(req.params.id) },
        data: { 
          name, 
          description, 
          price: parseFloat(price) || 0, 
          ...(imagePaths.length > 0 && { images: imagePaths }),
          variants: JSON.parse(variants || '[]'), 
          inventory: JSON.parse(inventory || '{}') 
        }
      });
      res.json({ success: true });
    } catch(err: any) {
      console.error('Error updating product:', err);
      res.json([]);
    }
  });

  app.put('/api/products/:id/builder', checkDb, async (req, res) => {
    try {
      const { config } = req.body;
      await prisma!.product.update({
        where: { id: Number(req.params.id) },
        data: { landing_page_config: config }
      });
      res.json({ success: true });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products/:id', checkDb, async (req, res) => {
    try {
      await prisma!.product.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders', checkDb, async (req, res) => {
    try {
      const { name, phone, wilaya, commune, address, product_id, variant_selected, total_price, delivery_fee, source, stop_desk } = req.body;
      
      const product = await prisma!.product.findUnique({ where: { id: Number(product_id) } });

      if (product) {
        const inventory = (product.inventory as any) || {};
        const variants = variant_selected || {};
        
        const keys = Object.keys(variants).sort();
        const inventoryKey = keys.map(k => `${k}:${variants[k]}`).join('_');
        
        if (inventoryKey && inventory[inventoryKey] !== undefined) {
          if (inventory[inventoryKey] <= 0) {
            return res.status(400).json({ error: 'Out of stock for this variant' });
          }
          inventory[inventoryKey] -= 1;
          await prisma!.product.update({
            where: { id: Number(product_id) },
            data: { inventory: inventory }
          });
        }
      }

      const order = await prisma!.order.create({
        data: {
          name, phone, wilaya, commune, address,
          product_id: Number(product_id),                
          variant_selected: variant_selected || {},
          total_price: parseFloat(total_price) || 0,                
          delivery_fee: parseFloat(delivery_fee) || 0,                
          source,
          stop_desk: stop_desk ? 1 : 0
        }
      });
      res.json({ id: order.id });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/orders', checkDb, async (req, res) => {
    try {
      const orders = await prisma!.order.findMany({
        include: { product: true },
        orderBy: { created_at: 'desc' }
      });
      res.json(Array.isArray(orders) ? orders : []);
    } catch(err: any) {
      console.error(err);
      res.json([]);
    }
  });

  app.post('/api/orders/delivery/ecotrack', checkDb, async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'No order IDs provided' });
      }

      const apiKeysSetting = await prisma.setting.findUnique({ where: { key: 'api_keys' } });
      if (!apiKeysSetting) {
        return res.status(400).json({ error: 'Ecotrack API configuration not found in settings' });
      }
      
      const apiKeys = apiKeysSetting.value as any;
      const ecotrackUrlStr = apiKeys.ecotrack_url || 'https://app.ecotrack.dz';
      const ecotrackToken = apiKeys.ecotrack_token;
      if (!ecotrackToken) {
        return res.status(400).json({ error: 'Ecotrack API token not found in settings' });
      }
      
      // ... (keep the same logic for Ecotrack Base URL cleaning) ...
      let ecotrackBaseUrl = ecotrackUrlStr.trim().replace(/\/+$/, '');
      const suffixes = ['/api/v1/create/orders', '/api/v1/create/order', '/api/v1/create', '/api/v1', '/create/orders', '/create/order'];
      for (const suffix of suffixes) {
        if ((ecotrackBaseUrl || '').toLowerCase().endsWith(suffix)) {
          ecotrackBaseUrl = ecotrackBaseUrl.slice(0, -suffix.length);
          break;
        }
      }
      ecotrackBaseUrl = ecotrackBaseUrl.replace(/\/+$/, '');

      // Get orders
      const orders = await prisma!.order.findMany({
        where: { id: { in: orderIds.map(Number) } },
        include: { product: true }
      });
      
      const wilayaMap: Record<string, string> = {
        'Adrar': '01', 'Chlef': '02', 'Laghouat': '03', 'Oum El Bouaghi': '04', 'Batna': '05',
        'Béjaïa': '06', 'Biskra': '07', 'Béchar': '08', 'Blida': '09', 'Bouira': '10',
        'Tamanrasset': '11', 'Tébessa': '12', 'Tlemcen': '13', 'Tiaret': '14', 'Tizi Ouzou': '15',
        'Alger': '16', 'Djelfa': '17', 'Jijel': '18', 'Sétif': '19', 'Saïda': '20',
        'Skikda': '21', 'Sidi Bel Abbès': '22', 'Annaba': '23', 'Guelma': '24', 'Constantine': '25',
        'Médéa': '26', 'Mostaganem': '27', "M'Sila": '28', 'Mascara': '29', 'Ouargla': '30',
        'Oran': '31', 'El Bayadh': '32', 'Illizi': '33', 'Bordj Bou Arreridj': '34', 'Boumerdès': '35',
        'El Tarf': '36', 'Tindouf': '37', 'Tissemsilt': '38', 'El Oued': '39', 'Khenchela': '40',
        'Souk Ahras': '41', 'Tipaza': '42', 'Mila': '43', 'Aïn Defla': '44', 'Naâma': '45',
        'Aïn Témouchent': '46', 'Ghardaïa': '47', 'Relizane': '48', 'Timimoun': '49',
        'Bordj Badji Mokhtar': '50', 'Ouled Djellal': '51', 'Béni Abbès': '52', 'In Salah': '53',
        'In Guezzam': '54', 'Touggourt': '55', 'Djanet': '56', "El M'Ghair": '57', 'El Meniaa': '58'
      };

      // Removed unused stopDeskCommunes array
      
      const payloadOrders: any = {};
      const communesCache: Record<number, any[]> = {};
      const warnings: string[] = []; // FIXED: 3
      
      const levenshtein = (a: string, b: string) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
          }
        }
        return matrix[b.length][a.length];
      };

      for (const o of orders) {
        let codeWilaya: any = o.wilaya;
        let wilayaName = o.wilaya;
        
        if (isNaN(parseInt(codeWilaya))) {
          codeWilaya = wilayaMap[codeWilaya] || "16"; 
        } else {
          for (const [name, id] of Object.entries(wilayaMap)) {
             if (parseInt(id) === parseInt(codeWilaya)) {
                wilayaName = name;
                break;
             }
          }
        }
        
        const wilayaIdInt = parseInt(codeWilaya);
        let targetCommune = o.commune || wilayaName || 'Alger';
        
        if (!communesCache[wilayaIdInt]) {
          try {
            console.log(`Fetching communes for wilaya ${wilayaIdInt}`);
            const communesRes = await fetch(`${ecotrackBaseUrl}/api/v1/get/communes?wilaya_id=${wilayaIdInt}`, {
              headers: { 
                'Authorization': ecotrackToken.startsWith('Bearer ') ? ecotrackToken : `Bearer ${ecotrackToken}`, 
                'Accept': 'application/json' 
              }
            });
            const text = await communesRes.text();
            console.log(`Communes response:`, text.substring(0, 100));
            communesCache[wilayaIdInt] = JSON.parse(text);
          } catch (e) {
            console.error(`Failed to fetch communes:`, e);
            communesCache[wilayaIdInt] = [];
          }
        }

        if (communesCache[wilayaIdInt] && Array.isArray(communesCache[wilayaIdInt])) {
          let bestCommune = targetCommune;
          let bestDist = Infinity;
          let selectedCommuneObj = null;
          const normalize = (s: string) => (s||'').toLowerCase().replace(/[^a-z]/g, '');
          const targetNorm = normalize(targetCommune);
          
          for (const cc of communesCache[wilayaIdInt]) {
            if (!cc.nom) continue;
            const d = levenshtein(targetNorm, normalize(cc.nom));
            if (d < bestDist) {
              bestDist = d;
              bestCommune = cc.nom;
              selectedCommuneObj = cc;
            }
          }
          
          if (bestDist < 5) {
            targetCommune = bestCommune;
            
            // Validate Stop Desk
            if (o.stop_desk === 1 && selectedCommuneObj && selectedCommuneObj.has_stop_desk !== 1) {
              // The selected commune does not have a stop desk.
              // Try to fallback to the Wilaya's main commune which likely has a stop desk.
              const wilayaNorm = normalize(wilayaName);
              const wilayaCommune = communesCache[wilayaIdInt].find((c: any) => normalize(c.nom) === wilayaNorm);
              if (wilayaCommune && wilayaCommune.has_stop_desk === 1) {
                warnings.push(`Order #${o.id}: commune ${selectedCommuneObj.nom} has no stop desk, fell back to ${wilayaCommune.nom}`); // FIXED: 3
                targetCommune = wilayaCommune.nom;
              } else {
                 warnings.push(`Order #${o.id}: commune ${selectedCommuneObj.nom} has no stop desk and couldn't find fallback`); // FIXED: 3
                 console.log("Warning: Requested stop desk in commune without one, and couldn't find fallback.", targetCommune);
              }
            }
          }
        }
        
        payloadOrders[o.id.toString()] = {
          reference: o.id.toString(),
          client: o.name || 'Client',
          nom_client: o.name || 'Client',
          telephone: o.phone || '0500000000',
          telephone_2: "",
          adresse: o.address || o.commune || 'Alger',
          code_postal: "",
          commune: targetCommune, 
          code_wilaya: wilayaIdInt,
          montant: parseInt(o.total_price.toString()) || 0,
          remarque: 'Sent from COD-Manager',
          note: 'Sent from COD-Manager',
          produit: (o.product as any)?.name || `Produit #${o.product_id}`,
          stock: 0,
          quantite: 1,
          type: o.stop_desk === 1 ? 0 : 1, // Usually 0 for desk, 1 for home delivery
          stop_desk: o.stop_desk || 0,
          boutique: "COD-Manager"
        };
      }

      console.log("Deploying to Ecotrack:", { url: `${ecotrackBaseUrl}/api/v1/create/orders`, ordersCount: Object.keys(payloadOrders).length });
      
      const response = await fetch(`${ecotrackBaseUrl}/api/v1/create/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ecotrackToken.startsWith('Bearer ') ? ecotrackToken : `Bearer ${ecotrackToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ orders: payloadOrders })
      });

      const responseText = await response.text();
      console.log("Ecotrack API Response:", response.status, responseText);
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse Ecotrack response:", responseText);
      }

      if (data?.results) {
         for (const [key, value] of Object.entries(data.results)) {
            const val = value as any;
            if (val?.success === true && val.tracking) {
               await prisma!.order.update({
                  where: { id: parseInt(key) },
                  data: { tracking_number: val.tracking, status: 'Expédié' }
               });
            }
         }
      }

      res.json({ success: true, message: 'Orders processed', results: data?.results || data, warnings }); // FIXED: 3

    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders/delivery/yalidine', checkDb, async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'No order IDs provided' });
      }

      const apiKeysSetting = await prisma.setting.findUnique({ where: { key: 'api_keys' } });
      if (!apiKeysSetting) {
        return res.status(400).json({ error: 'Yalidine API configuration not found in settings' });
      }
      
      const apiKeys = apiKeysSetting.value as any;
      const yalidineId = apiKeys.yalidine_id;
      const yalidineToken = apiKeys.yalidine_token;
      
      if (!yalidineId || !yalidineToken) {
        return res.status(400).json({ error: 'Yalidine API ID or Token missing in settings' });
      }

      // Get orders
      const orders = await prisma!.order.findMany({
        where: { id: { in: orderIds.map(Number) } },
        include: { product: true }
      });
      
      const payload: any[] = [];
      orders.forEach((o) => {
        let wilayaName = o.wilaya;
        let targetCommune = o.commune || wilayaName || 'Alger';
        
        payload.push({
          order_id: o.id.toString(),
          firstname: o.name || 'Client',
          familyname: '',
          contact_phone: o.phone || '0500000000',
          address: o.address || o.commune || 'Alger',
          to_commune_name: targetCommune,
          to_wilaya_name: wilayaName,
          product_list: (o.product as any)?.name || `Produit #${o.product_id}`,
          price: parseInt(o.total_price.toString()) || 0,
          freeshipping: false,
          is_stopdesk: o.stop_desk === 1,
          has_exchange: 0,
          product_to_collect: null
        });
      });

      console.log("Deploying to Yalidine:", { ordersCount: payload.length });
      
      const response = await fetch(`https://api.yalidine.app/v1/parcels/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-ID': yalidineId,
          'X-API-TOKEN': yalidineToken,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse Yalidine response:", responseText);
      }

      if (data && data.has_errors === false) {
         // Yalidine gives an object of keys with tracking
         Object.keys(data).forEach(async (tracking) => {
            const result = data[tracking];
            if (result && result.order_id) {
               await prisma!.order.updateMany({
                 where: { id: parseInt(result.order_id) },
                 data: { tracking_number: tracking, status: 'Expédié' }
               });
            }
         });
      }

      res.json({ success: true, message: 'Orders processed via Yalidine', results: data });

    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/orders/:id/status', checkDb, async (req, res) => {
    try {
      const { status } = req.body;
      await prisma!.order.update({
        where: { id: Number(req.params.id) },
        data: { status: status }
      });
      res.json({ success: true });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders/sync/ecotrack', checkDb, async (req, res) => {
    try {
      // Get API token
      const setting = await prisma!.setting.findUnique({ where: { key: 'api_keys' } });
      if (!setting) return res.status(400).json({ error: 'Ecotrack API configuration not found' });
      
      const apiKeys = setting.value as any;
      const ecotrackToken = apiKeys.ecotrack_token;
      const ecotrackUrlStr = apiKeys.ecotrack_url || 'https://app.ecotrack.dz';
      if (!ecotrackToken) return res.status(400).json({ error: 'Ecotrack API token missing' });

      let ecotrackBaseUrl = ecotrackUrlStr.trim().replace(/\/+$/, '');
      const suffixes = ['/api/v1/create/orders', '/api/v1/create/order', '/api/v1/create', '/api/v1', '/create/orders', '/create/order'];
      for (const suffix of suffixes) {
        if ((ecotrackBaseUrl || '').toLowerCase().endsWith(suffix)) {
          ecotrackBaseUrl = ecotrackBaseUrl.slice(0, -suffix.length);
          break;
        }
      }
      ecotrackBaseUrl = ecotrackBaseUrl.replace(/\/+$/, '');

      const ordersToSync = await prisma!.order.findMany({
        where: {
          NOT: {
            status: { in: ['Annulé', 'Livre', 'Retourné', 'payé_et_archivé', 'paye_et_archive', 'retour_archive', 'annule'] }
          },
          tracking_number: { not: null }
        },
        select: { id: true, tracking_number: true }
      });
      
      if (ordersToSync.length === 0) {
        return res.json({ success: true, message: 'No orders to sync' });
      }

      const trackings = ordersToSync.map(o => o.tracking_number).join(',');
      let queryToken = ecotrackToken;
      if (queryToken.startsWith('Bearer ')) queryToken = queryToken.substring(7);
      const syncUrl = `${ecotrackBaseUrl}/api/v1/get/orders/status?api_token=${queryToken}&trackings=${encodeURIComponent(trackings)}&status=all`;

      console.log("Syncing from Ecotrack status API:", syncUrl);
      
      const response = await fetch(syncUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Ecotrack Sync API error (${response.status})` });
      }

      const data = await response.json();
      if (!data.data || !data.results) {
        return res.status(400).json({ error: 'Unexpected response format from Ecotrack', raw: data });
      }

      let syncCount = 0;

      for (const [key, value] of Object.entries(data.results)) {
   const val = value as any;
   if (val?.success === true && val.tracking) {
      const orderId = parseInt(val.reference || key);
      if (!isNaN(orderId)) {
         await prisma!.order.update({
            where: { id: orderId },
            data: { tracking_number: val.tracking, status: 'Expédié' }
         });
         syncCount++; // FIXED: 4
      }
   }
}

      res.json({ success: true, message: `Synchronized ${syncCount} orders`, data: data.data });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/api/analytics', checkDb, async (req, res) => {
    try {
      const totalOrders = await prisma!.order.count();
      const totalRevenue = (await prisma!.order.aggregate({ _sum: { total_price: true } }))._sum.total_price || 0;
      
      // PostgreSQL specific raw query for orders per day
      const ordersPerDay: any = await prisma!.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*)::int as count 
        FROM "Order" 
        GROUP BY DATE(created_at) 
        ORDER BY date DESC 
        LIMIT 30
      `;

      res.json({ totalOrders, totalRevenue, ordersPerDay });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/pixels', checkDb, async (req, res) => {
    try {
      const pixels = await prisma!.pixel.findMany({ orderBy: { created_at: 'desc' } });
      res.json(pixels);
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/pixels', checkDb, async (req, res) => {
    try {
      const { platform, pixel_id } = req.body;
      await prisma!.pixel.create({ data: { platform, pixel_id } });
      res.json({ success: true });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/pixels/:id', checkDb, async (req, res) => {
    try {
      await prisma!.pixel.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/settings/:key', checkDb, async (req, res) => {
    try {
      const setting = await prisma!.setting.findUnique({ where: { key: req.params.key } });
      res.json(setting ? setting.value : { value: null });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/:key', checkDb, async (req, res) => {
    try {
      await prisma!.setting.upsert({
        where: { key: req.params.key },
        update: { value: req.body },
        create: { key: req.params.key, value: req.body }
      });
      res.json({ success: true });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });


  // ====== VITE MIDDLEWARE ======
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
