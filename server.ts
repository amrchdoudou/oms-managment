import express from 'express';
import path from 'path';
import cors from 'cors';
import Database from 'better-sqlite3';
import fs from 'fs';
import multer from 'multer';

// Ensure uploads dir exists in the project root
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer for upload simulation
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

// Init database in project root
const db = new Database(path.join(process.cwd(), 'cod-manager.db'));

// Setup tables
db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    store_id INTEGER,
    FOREIGN KEY(store_id) REFERENCES stores(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    images JSON,
    variants JSON,
    inventory JSON,
    store_id INTEGER,
    landing_page_config JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    wilaya TEXT NOT NULL,
    commune TEXT NOT NULL,
    address TEXT NOT NULL,
    product_id INTEGER,
    variant_selected JSON,
    total_price REAL NOT NULL,
    delivery_fee REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    source TEXT,
    store_id INTEGER,
    stop_desk INTEGER DEFAULT 0,
    tracking_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS pixels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,
    pixel_id TEXT NOT NULL,
    store_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSON NOT NULL,
    store_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'store' or 'product'
    config JSON NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Apply alters just in case columns don't exist
try { db.exec('ALTER TABLE products ADD COLUMN landing_page_config JSON'); } catch(e){}
try { db.exec('ALTER TABLE products ADD COLUMN store_id INTEGER'); } catch(e){}
try { db.exec('ALTER TABLE products ADD COLUMN inventory JSON'); } catch(e){}
try { db.exec('ALTER TABLE products ADD COLUMN template_id INTEGER'); } catch(e){}
try { db.exec('ALTER TABLE products ADD COLUMN metafields JSON'); } catch(e){}
try { db.exec('ALTER TABLE orders ADD COLUMN store_id INTEGER'); } catch(e){}
try { db.exec('ALTER TABLE orders ADD COLUMN stop_desk INTEGER DEFAULT 0'); } catch(e){}
try { db.exec('ALTER TABLE orders ADD COLUMN tracking_number TEXT'); } catch(e){}
try { db.exec('ALTER TABLE pixels ADD COLUMN store_id INTEGER'); } catch(e){}
try { db.exec('ALTER TABLE settings ADD COLUMN store_id INTEGER'); } catch(e){}


// Insert default settings if they don't exist
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
insertSetting.run('delivery_fees', JSON.stringify({ home: 600, desk: 400 }));
insertSetting.run('api_keys', JSON.stringify({ yalidine_id: '', yalidine_token: '', ecotrack_token: '' }));

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // ====== STORE CONFIGURATION ROUTES ======

  app.get('/api/settings/store_config', (req, res) => {
    try {
      const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
      const row = stmt.get('store_config') as any;
      res.json(row ? safeParse(row.value, {}) : {});
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/store_config', (req, res) => {
    try {
      const config = JSON.stringify(req.body);
      const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      stmt.run('store_config', config);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ====== TEMPLATE ROUTES ======

  app.get('/api/templates', (req, res) => {
    try {
      const type = req.query.type;
      let stmt;
      if (type) {
        stmt = db.prepare('SELECT * FROM templates WHERE type = ? ORDER BY created_at DESC');
        res.json(stmt.all(type).map((t: any) => ({ ...t, config: safeParse(t.config, {}) })));
      } else {
        stmt = db.prepare('SELECT * FROM templates ORDER BY created_at DESC');
        res.json(stmt.all().map((t: any) => ({ ...t, config: safeParse(t.config, {}) })));
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/templates/:id', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM templates WHERE id = ?');
      const t = stmt.get(req.params.id) as any;
      if (!t) return res.status(404).json({ error: 'Template not found' });
      res.json({ ...t, config: safeParse(t.config, {}) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/templates', (req, res) => {
    try {
      const { name, type, config } = req.body;
      const stmt = db.prepare('INSERT INTO templates (name, type, config) VALUES (?, ?, ?)');
      const info = stmt.run(name, type, JSON.stringify(config));
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/templates/:id', (req, res) => {
    try {
      const { name, config } = req.body;
      const stmt = db.prepare('UPDATE templates SET name = ?, config = ? WHERE id = ?');
      stmt.run(name, JSON.stringify(config), req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/templates/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
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

  app.get('/api/products', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM products ORDER BY created_at DESC');
      const products = (stmt.all() as any[]).map(p => ({
        ...p,
        images: safeParse(p.images, []),
        variants: safeParse(p.variants, []),
        inventory: safeParse(p.inventory, {}),
        metafields: safeParse(p.metafields, {}),
        landing_page_config: p.landing_page_config ? safeParse(p.landing_page_config, null) : null
      }));
      res.json(products);
    } catch(err: any) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/products/:id', (req, res) => {
    try {
      console.log(`Fetching product with ID: ${req.params.id}`);
      const stmt = db.prepare('SELECT * FROM products WHERE id = ?');
      const p = stmt.get(req.params.id) as any;
      if (!p) {
        console.warn(`Product ${req.params.id} not found`);
        return res.status(404).json({ error: 'Not found' });
      }
      
      const payload = {
        ...p,
        images: safeParse(p.images, []),
        variants: safeParse(p.variants, []),
        inventory: safeParse(p.inventory, {}),
        metafields: safeParse(p.metafields, {}),
        landing_page_config: p.landing_page_config ? safeParse(p.landing_page_config, null) : null
      };
      res.json(payload);
    } catch(err: any) {
      console.error(`Error fetching product ${req.params.id}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/products', upload.array('images', 5), (req, res) => {
    try {
      const { name, description, price, variants, inventory } = req.body;
      let imagePaths = [];
      if (req.files && Array.isArray(req.files)) {
        imagePaths = req.files.map(f => '/uploads/' + f.filename);
      }

      const stmt = db.prepare('INSERT INTO products (name, description, price, images, variants, inventory) VALUES (?, ?, ?, ?, ?, ?)');
      const info = stmt.run(name, description, parseFloat(price) || 0, JSON.stringify(imagePaths), variants || '[]', inventory || '{}');
      res.json({ id: info.lastInsertRowid });
    } catch(err: any) {
      console.error('Error adding product:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', upload.array('images', 5), (req, res) => {
    try {
      const { name, description, price, variants, inventory } = req.body;
      // Note: simplistic update, normally we'd handle images too if provided
      const stmt = db.prepare('UPDATE products SET name = ?, description = ?, price = ?, variants = ?, inventory = ? WHERE id = ?');
      stmt.run(name, description, parseFloat(price) || 0, variants || '[]', inventory || '{}', req.params.id);
      res.json({ success: true });
    } catch(err: any) {
      console.error('Error updating product:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id/builder', (req, res) => {
    try {
      const { config } = req.body;
      db.prepare('UPDATE products SET landing_page_config = ? WHERE id = ?').run(JSON.stringify(config), req.params.id);
      res.json({ success: true });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    try {
      const stmt = db.prepare('DELETE FROM products WHERE id = ?');
      stmt.run(req.params.id);
      res.json({ success: true });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders', (req, res) => {
    try {
      const { name, phone, wilaya, commune, address, product_id, variant_selected, total_price, delivery_fee, source, stop_desk } = req.body;
      
      // Stock check and decrement
      const productStmt = db.prepare('SELECT * FROM products WHERE id = ?');
      const product = productStmt.get(product_id) as any;
      
      if (product) {
        const inventory = JSON.parse(product.inventory || '{}');
        const variants = variant_selected || {};
        
        // Generate inventory key from selected variants
        const keys = Object.keys(variants).sort();
        const inventoryKey = keys.map(k => `${k}:${variants[k]}`).join('_');
        
        if (inventoryKey && inventory[inventoryKey] !== undefined) {
          if (inventory[inventoryKey] <= 0) {
            return res.status(400).json({ error: 'Out of stock for this variant' });
          }
          // Decrement stock
          inventory[inventoryKey] -= 1;
          db.prepare('UPDATE products SET inventory = ? WHERE id = ?').run(JSON.stringify(inventory), product_id);
        }
      }

      const stmt = db.prepare('INSERT INTO orders (name, phone, wilaya, commune, address, product_id, variant_selected, total_price, delivery_fee, source, stop_desk) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
      const info = stmt.run(name, phone, wilaya, commune, address, product_id, JSON.stringify(variant_selected || {}), total_price, delivery_fee, source, stop_desk ? 1 : 0);
      res.json({ id: info.lastInsertRowid });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/orders', (req, res) => {
    try {
      const stmt = db.prepare('SELECT o.*, p.name as product_name FROM orders o LEFT JOIN products p ON o.product_id = p.id ORDER BY o.created_at DESC');
      const orders = (stmt.all() as any[]).map(o => ({
        ...o,
        variant_selected: JSON.parse(o.variant_selected || '{}')
      }));
      res.json(orders);
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders/delivery/ecotrack', async (req, res) => {
    try {
      const { orderIds } = req.body;
      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'No order IDs provided' });
      }

      const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
      const setting = stmt.get('api_keys') as any;
      if (!setting) {
        return res.status(400).json({ error: 'Ecotrack API configuration not found in settings' });
      }
      const apiKeys = JSON.parse(setting.value);
      const ecotrackUrlStr = apiKeys.ecotrack_url || 'https://app.ecotrack.dz';
      const ecotrackToken = apiKeys.ecotrack_token;
      if (!ecotrackToken) {
        return res.status(400).json({ error: 'Ecotrack API token not found in settings' });
      }
      let ecotrackBaseUrl = ecotrackUrlStr.trim();
      // Remove trailing slashes
      ecotrackBaseUrl = ecotrackBaseUrl.replace(/\/+$/, '');
      
      // Clean common API suffixes to prevent double concatenation
      // Example: platform.com/api/v1/create/orders -> platform.com
      const suffixes = [
        '/api/v1/create/orders',
        '/api/v1/create/order',
        '/api/v1/create',
        '/api/v1',
        '/create/orders',
        '/create/order'
      ];
      
      for (const suffix of suffixes) {
        if (ecotrackBaseUrl.toLowerCase().endsWith(suffix)) {
          ecotrackBaseUrl = ecotrackBaseUrl.slice(0, -suffix.length);
          break; // Stop after first match
        }
      }
      
      // Final trim of any remaining slashes
      ecotrackBaseUrl = ecotrackBaseUrl.replace(/\/+$/, '');

      // Get orders
      const getOrderStats = db.prepare('SELECT o.*, p.name as product_name FROM orders o LEFT JOIN products p ON o.product_id = p.id WHERE o.id IN (' + orderIds.map(() => '?').join(',') + ')');
      const orders = getOrderStats.all(...orderIds) as any[];

        // Wilaya mapping for Ecotrack (ID mapping)
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

        // Communes known to have Stop Desks (Bureaux)
        // This is a partial list based on common delivery data. 
        // If a commune is not here and stop_desk is 1, we'll use the wilaya name as fallback.
        const stopDeskCommunes = [
          "Alger Centre", "Sidi M'Hamed", "El Madania", "Belouizdad", "Bab El Oued", "Bologhine", "Casbah", "Oued Koriche", "Bir Mourad Rais", "El Biar", "Bouzareah", "Birkhadem", "El Harrach", "Baraki", "Oued Smar", "Bachedjerah", "Hussein Dey", "Kouba", "Bourouba", "Dar El Beida", "Bab Ezzouar", "Ben Aknoun", "Dely Ibrahim", "Hydra", "Mohammadia", "Ain Taya", "Ain Benian", "Staoueli", "Zeralda", "Cheraga", "Draria", "Douera", "Ouled Fayet", "Tessala El Merdja", "Reghaia", "Rouiba", "Bordj El Kiffan", "Bordj El Bahri", "Les Eucalyptus", "Gue de Constantine", "Ain Romana", "Ain Messous", "Ain Touta", "Ain Djasser", "Blida", "Boufarik", "Tlemcen", "Oran", "Constantine", "Setif", "Batna", "Djelfa", "Annaba", "Bejaia", "Chlef", "Biskra", "Tiaret"
        ];

        const payloadOrders: any = {};
        orders.forEach((o, index) => {
          let codeWilaya: any = o.wilaya;
          let wilayaName = o.wilaya;
          
          // If it's a name, look up ID.
          if (isNaN(parseInt(codeWilaya))) {
            codeWilaya = wilayaMap[codeWilaya] || "16"; 
          } else {
            // Find wilaya name from ID if possible
            for (const [name, id] of Object.entries(wilayaMap)) {
               if (parseInt(id) === parseInt(codeWilaya)) {
                  wilayaName = name;
                  break;
               }
            }
          }
          
          // Convert to actual integer as requested by API error message
          const wilayaIdInt = parseInt(codeWilaya);
          
          let targetCommune = o.commune || wilayaName || 'Alger';
          
          // If stop_desk is requested, check if commune has an office.
          // If not in our list, fallback to wilaya name (usually central bureau)
          if (o.stop_desk === 1) {
             const lowerCommune = targetCommune.toLowerCase();
             const hasBureau = stopDeskCommunes.some(c => c.toLowerCase() === lowerCommune);
             if (!hasBureau) {
                console.log(`Fallback stop_desk for ${targetCommune} to wilaya ${wilayaName}`);
                targetCommune = wilayaName;
             }
          }
          
          payloadOrders[index.toString()] = {
            reference: o.id.toString(),
            nom_client: o.name || 'Client',
            telephone: o.phone || '0500000000',
            telephone_2: "",
            adresse: o.address || o.commune || 'Alger',
            code_postal: "",
            commune: targetCommune, 
            code_wilaya: wilayaIdInt,
            montant: parseInt(o.total_price.toString()) || 0,
            remarque: 'Sent from COD-Manager',
            produit: o.product_name || `Produit #${o.product_id}`,
            stock: 0,
            quantite: 1,
            type: 1,
            stop_desk: o.stop_desk || 0
          };
        });

      console.log("Deploying to Ecotrack:", { url: `${ecotrackBaseUrl}/api/v1/create/orders`, orders: payloadOrders });
      
      const response = await fetch(`${ecotrackBaseUrl}/api/v1/create/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ecotrackToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ orders: payloadOrders })
      });

      const responseText = await response.text();
      console.log("Ecotrack Response:", response.status, responseText);
      
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse Ecotrack JSON response");
      }

      let hasError = false;
      let errorMessages: string[] = [];

      if (!response.ok) {
         hasError = true;
         let msg = data?.message || '';
         if (!msg && response.status === 404) {
           msg = 'Endpoint not found (404). Verify your Ecotrack Base URL.';
         } else if (!msg) {
           msg = `Ecotrack HTTP Error (${response.status})`;
         }
         errorMessages.push(msg);
      }

      if (data?.results) {
         const updateTracking = db.prepare('UPDATE orders SET tracking_number = ?, status = ? WHERE id = ?');
         for (const [key, value] of Object.entries(data.results)) {
            const val = value as any;
            if (val === null) continue;
            
            // If success, update tracking number in our DB
            if (val.success === true && val.tracking) {
               try {
                  updateTracking.run(val.tracking, 'Expédié', parseInt(key));
               } catch (dbErr) {
                  console.error(`Failed to update tracking for order ${key}:`, dbErr);
               }
            }

            // Ecotrack returns success: true on success, so if it's false or undefined (like field error object) it's an error
            if (val.success === false || (typeof val.success === 'undefined' && Object.keys(val).length > 0)) {
               hasError = true;
               let orderMsg = `Order ref ${key}: `;
               if (val.errors) {
                  orderMsg += typeof val.errors === 'string' ? val.errors : JSON.stringify(val.errors);
               } else {
                  // omit `success: false` if it's the only other thing
                  const { success, ...rest } = val;
                  orderMsg += Object.keys(rest).length > 0 ? JSON.stringify(rest) : 'Unknown error';
               }
               errorMessages.push(orderMsg);
            }
         }
      } else if (data?.errors) {
         hasError = true;
         errorMessages.push(typeof data.errors === 'string' ? data.errors : JSON.stringify(data.errors));
      }

      if (hasError) {
         return res.status(400).json({ 
            error: errorMessages.join(' | '),
            results: data?.results || data?.errors 
         });
      }

      res.json({ success: true, message: 'Orders sent to Ecotrack', results: data.results });

    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/orders/:id/status', (req, res) => {
    try {
      const { status } = req.body;
      db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
      res.json({ success: true });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/orders/sync/ecotrack', async (req, res) => {
    try {
      // Get API token
      const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get('api_keys') as any;
      if (!setting) return res.status(400).json({ error: 'Ecotrack API configuration not found' });
      
      const apiKeys = JSON.parse(setting.value);
      const ecotrackToken = apiKeys.ecotrack_token;
      const ecotrackUrlStr = apiKeys.ecotrack_url || 'https://app.ecotrack.dz';
      if (!ecotrackToken) return res.status(400).json({ error: 'Ecotrack API token missing' });

      let ecotrackBaseUrl = ecotrackUrlStr.trim().replace(/\/+$/, '');
      // Handle known suffixes
      const suffixes = ['/api/v1/create/orders', '/api/v1/create/order', '/api/v1/create', '/api/v1', '/create/orders', '/create/order'];
      for (const suffix of suffixes) {
        if (ecotrackBaseUrl.toLowerCase().endsWith(suffix)) {
          ecotrackBaseUrl = ecotrackBaseUrl.slice(0, -suffix.length);
          break;
        }
      }
      ecotrackBaseUrl = ecotrackBaseUrl.replace(/\/+$/, '');

      // Get orders with tracking numbers that are not in terminal status
      const ordersToSync = db.prepare("SELECT id, tracking_number FROM orders WHERE tracking_number IS NOT NULL AND status NOT IN ('Annulé', 'Livre', 'Retourné', 'payé_et_archivé', 'paye_et_archive', 'retour_archive', 'annule')").all() as any[];
      
      if (ordersToSync.length === 0) {
        return res.json({ success: true, message: 'No orders to sync' });
      }

      const trackings = ordersToSync.map(o => o.tracking_number).join(',');
      const syncUrl = `${ecotrackBaseUrl}/api/v1/get/orders/status?api_token=${ecotrackToken}&trackings=${encodeURIComponent(trackings)}&status=all`;

      console.log("Syncing from Ecotrack status API:", syncUrl);
      
      const response = await fetch(syncUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Ecotrack Sync API error (${response.status})` });
      }

      const data = await response.json();
      if (!data.data) {
        return res.status(400).json({ error: 'Unexpected response format from Ecotrack', raw: data });
      }

      const updateStmt = db.prepare('UPDATE orders SET status = ? WHERE tracking_number = ?');
      let syncCount = 0;

      for (const [tracking, info] of Object.entries(data.data)) {
        const val = info as any;
        if (val && val.status) {
          updateStmt.run(val.status, tracking);
          syncCount++;
        }
      }

      res.json({ success: true, message: `Synchronized ${syncCount} orders`, data: data.data });

    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/analytics', (req, res) => {
    try {
      // Basic analytics
      const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
      const totalRevenue = (db.prepare('SELECT SUM(total_price) as sum FROM orders').get() as any).sum || 0;
      // Orders per day
      const ordersPerDay = db.prepare("SELECT date(created_at) as date, COUNT(*) as count FROM orders GROUP BY date(created_at) ORDER BY date DESC LIMIT 30").all();
      res.json({ totalOrders, totalRevenue, ordersPerDay });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/pixels', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM pixels ORDER BY created_at DESC');
      res.json(stmt.all());
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/pixels', (req, res) => {
    try {
      const { platform, pixel_id } = req.body;
      db.prepare('INSERT INTO pixels (platform, pixel_id) VALUES (?, ?)').run(platform, pixel_id);
      res.json({ success: true });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/pixels/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM pixels WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/settings/:key', (req, res) => {
    try {
      const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
      const setting = stmt.get(req.params.key) as any;
      if (setting) {
        // Return the parsed value
        res.json(JSON.parse(setting.value));
      } else {
        res.json({ value: null });
      }
    } catch(err: any) {
      console.error(err); res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/settings/:key', (req, res) => {
    try {
      const stmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');
      const info = stmt.run(JSON.stringify(req.body), req.params.key);
      if (info.changes === 0) {
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(req.params.key, JSON.stringify(req.body));
      }
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
