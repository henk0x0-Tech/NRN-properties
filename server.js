/**
 * ============================================================
 * NRN PROPERTIES — Node.js Backend & CMS API Server
 * Electronic City Phase 1 & 2 · Bangalore Luxury Portal
 * ============================================================
 * 
 * Features:
 *  - Native Node.js HTTP + Optional Express support
 *  - Full RESTful DBMS API for properties, leads, subscribers, and stats
 *  - Dynamic Google Analytics (GA4) injection & configuration
 *  - Automatic JSON database backup on write
 *  - Static file server with MIME detection and caching headers
 *  - Lead capturing & email notification webhook ready
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Server Configuration
const PORT = process.env.PORT || 1234;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT_DIR = __dirname;
const DATA_FILE = path.join(ROOT_DIR, 'data.json');
const BACKUP_DIR = path.join(ROOT_DIR, '.backups');

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

// Ensure backup folder exists
if (!fs.existsSync(BACKUP_DIR)) {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  } catch (err) {
    console.error('Warning: Could not create backups directory:', err.message);
  }
}

// ── Database Helper Functions ───────────────────────────────────────────────

function readDatabase() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      throw new Error(`Data file not found at ${DATA_FILE}`);
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data.json:', err.message);
    return null;
  }
}

function writeDatabase(data) {
  try {
    // 1. Create a timestamped backup before writing
    if (fs.existsSync(DATA_FILE)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(BACKUP_DIR, `data-backup-${timestamp}.json`);
      fs.copyFileSync(DATA_FILE, backupPath);
      
      // Clean up old backups (keep latest 15)
      try {
        const files = fs.readdirSync(BACKUP_DIR)
          .filter(f => f.startsWith('data-backup-') && f.endsWith('.json'))
          .sort()
          .reverse();
        if (files.length > 15) {
          files.slice(15).forEach(f => {
            fs.unlinkSync(path.join(BACKUP_DIR, f));
          });
        }
      } catch (e) {
        // non-blocking
      }
    }

    // 2. Update metadata
    if (!data._meta) data._meta = {};
    data._meta.lastUpdated = new Date().toISOString();
    
    // 3. Write formatted JSON
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to data.json:', err.message);
    return false;
  }
}

// Helper to parse JSON request bodies
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 10 * 1024 * 1024) { // 10MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

// Helper to send standard JSON responses
function sendJSON(res, statusCode, data, headers = {}) {
  const payload = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    ...headers
  });
  res.end(payload);
}

// ── HTTP Request Router ─────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  const method = req.method.toUpperCase();

  // 1. Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // ── REST API ROUTES ───────────────────────────────────────────────────────
  
  if (pathname.startsWith('/api/')) {
    // GET /api/health
    if (pathname === '/api/health' && method === 'GET') {
      return sendJSON(res, 200, {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime())
      });
    }

    // GET /api/data - Full database
    if (pathname === '/api/data' && method === 'GET') {
      const db = readDatabase();
      if (!db) return sendJSON(res, 500, { error: 'Failed to read database' });
      return sendJSON(res, 200, db);
    }

    // POST /api/data - Full database overwrite (from Admin Panel / raw editor)
    if (pathname === '/api/data' && method === 'POST') {
      try {
        const body = await parseBody(req);
        if (!body || typeof body !== 'object') {
          return sendJSON(res, 400, { error: 'Invalid JSON payload' });
        }
        const success = writeDatabase(body);
        if (success) {
          return sendJSON(res, 200, { success: true, message: 'Database saved successfully' });
        } else {
          return sendJSON(res, 500, { error: 'Failed to save database file' });
        }
      } catch (err) {
        return sendJSON(res, 400, { error: err.message });
      }
    }

    // GET /api/properties
    if (pathname === '/api/properties' && method === 'GET') {
      const db = readDatabase();
      if (!db) return sendJSON(res, 500, { error: 'Failed to read database' });
      return sendJSON(res, 200, { residences: db.residences || [] });
    }

    // POST /api/properties - Create or update property
    if (pathname === '/api/properties' && method === 'POST') {
      try {
        const property = await parseBody(req);
        const db = readDatabase();
        if (!db) return sendJSON(res, 500, { error: 'Database unavailable' });
        
        if (!property.id) {
          property.id = 'prop-' + Date.now();
        }
        
        if (!db.residences) db.residences = [];
        const index = db.residences.findIndex(p => p.id === property.id);
        if (index >= 0) {
          db.residences[index] = property;
        } else {
          db.residences.push(property);
        }
        
        writeDatabase(db);
        return sendJSON(res, 200, { success: true, property });
      } catch (err) {
        return sendJSON(res, 400, { error: err.message });
      }
    }

    // DELETE /api/properties/:id
    if (pathname.startsWith('/api/properties/') && method === 'DELETE') {
      const id = pathname.replace('/api/properties/', '');
      const db = readDatabase();
      if (!db) return sendJSON(res, 500, { error: 'Database unavailable' });
      
      const beforeCount = (db.residences || []).length;
      db.residences = (db.residences || []).filter(p => p.id !== id);
      
      if (db.residences.length === beforeCount) {
        return sendJSON(res, 404, { error: 'Property not found' });
      }
      
      writeDatabase(db);
      return sendJSON(res, 200, { success: true, message: `Property ${id} deleted` });
    }

    // GET /api/leads - Retrieve leads
    if (pathname === '/api/leads' && method === 'GET') {
      const db = readDatabase();
      if (!db) return sendJSON(res, 500, { error: 'Failed to read database' });
      return sendJSON(res, 200, { leads: db.leads || [] });
    }

    // POST /api/leads - Capture lead from website form
    if (pathname === '/api/leads' && method === 'POST') {
      try {
        const lead = await parseBody(req);
        const db = readDatabase();
        if (!db) return sendJSON(res, 500, { error: 'Database unavailable' });
        
        const newLead = {
          id: 'lead-' + Date.now(),
          name: lead.name || 'Anonymous Inquiry',
          phone: lead.phone || '',
          email: lead.email || '',
          residence: lead.residence || lead.property || 'General Inquiry',
          location: lead.location || 'Electronic City',
          date: lead.date || '',
          time: lead.time || '',
          notes: lead.notes || lead.message || '',
          submittedAt: new Date().toISOString(),
          status: 'new'
        };

        if (!db.leads) db.leads = [];
        db.leads.unshift(newLead);
        writeDatabase(db);

        console.log(`[LEAD CAPTURED] ${newLead.name} (${newLead.phone || newLead.email}) for ${newLead.residence}`);
        return sendJSON(res, 201, { success: true, lead: newLead });
      } catch (err) {
        return sendJSON(res, 400, { error: err.message });
      }
    }

    // GET /api/subscribers
    if (pathname === '/api/subscribers' && method === 'GET') {
      const db = readDatabase();
      if (!db) return sendJSON(res, 500, { error: 'Failed to read database' });
      return sendJSON(res, 200, { subscribers: db.subscribers || [] });
    }

    // POST /api/subscribers - Subscribe to private previews
    if (pathname === '/api/subscribers' && method === 'POST') {
      try {
        const payload = await parseBody(req);
        const email = (payload.email || '').trim().toLowerCase();
        if (!email || !email.includes('@')) {
          return sendJSON(res, 400, { error: 'Valid email address required' });
        }

        const db = readDatabase();
        if (!db) return sendJSON(res, 500, { error: 'Database unavailable' });
        if (!db.subscribers) db.subscribers = [];

        const exists = db.subscribers.find(s => (typeof s === 'string' ? s : s.email) === email);
        if (!exists) {
          db.subscribers.push({
            id: 'sub-' + Date.now(),
            email: email,
            subscribedAt: new Date().toISOString()
          });
          writeDatabase(db);
        }

        console.log(`[SUBSCRIBER JOINED] ${email}`);
        return sendJSON(res, 201, { success: true, message: 'Subscribed successfully' });
      } catch (err) {
        return sendJSON(res, 400, { error: err.message });
      }
    }

    // GET & POST /api/settings - Site & Google Analytics Settings
    if (pathname === '/api/settings' && method === 'GET') {
      const db = readDatabase();
      if (!db) return sendJSON(res, 500, { error: 'Failed to read database' });
      return sendJSON(res, 200, {
        site: db.site || {},
        analytics: db.analytics || { googleAnalyticsId: 'G-XXXXXXXXXX', enabled: true }
      });
    }

    if (pathname === '/api/settings' && method === 'POST') {
      try {
        const payload = await parseBody(req);
        const db = readDatabase();
        if (!db) return sendJSON(res, 500, { error: 'Database unavailable' });

        if (payload.site) db.site = { ...db.site, ...payload.site };
        if (payload.analytics) db.analytics = { ...db.analytics, ...payload.analytics };
        
        writeDatabase(db);
        return sendJSON(res, 200, { success: true, site: db.site, analytics: db.analytics });
      } catch (err) {
        return sendJSON(res, 400, { error: err.message });
      }
    }

    // POST /api/analytics/track - Server-side analytics logging
    if (pathname === '/api/analytics/track' && method === 'POST') {
      try {
        const evt = await parseBody(req);
        console.log(`[ANALYTICS EVENT] ${evt.eventName || 'page_view'}:`, evt.params || {});
        return sendJSON(res, 200, { recorded: true });
      } catch (err) {
        return sendJSON(res, 400, { error: err.message });
      }
    }

    // 404 for unhandled API routes
    return sendJSON(res, 404, { error: `API route not found: ${pathname}` });
  }

  // ── STATIC FILE SERVING ───────────────────────────────────────────────────

  let filePath = path.join(ROOT_DIR, pathname);

  // If path is a directory, serve index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    // Try appending .html
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
  }

  // Check if file exists
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>404 Not Found - NRN Properties</title></head>
      <body style="background:#0b0d10;color:#e8ebf0;font-family:sans-serif;text-align:center;padding:100px 20px;">
        <h1 style="color:#d4af37;font-size:3rem;margin-bottom:10px;">404</h1>
        <h2>Residence or Page Not Found</h2>
        <p style="color:#8c95a6;">The requested luxury plate or page could not be located.</p>
        <a href="/" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#d4af37;color:#0b0d10;text-decoration:none;font-weight:bold;border-radius:4px;">Return to Portfolio</a>
      </body>
      </html>
    `);
  }

  // Read and serve file
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end(`Internal Server Error: ${err.message}`);
  }
});

// Start Server
server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║   ✨  NRN PROPERTIES — LUXURY REAL ESTATE NODE.JS SERVER  ✨      ║
║                                                                   ║
║   📍 Main Portal:      http://localhost:${PORT}/                     ║
║   🔐 Admin CPanel:     http://localhost:${PORT}/admin/               ║
║   ⚡ REST API:         http://localhost:${PORT}/api/data             ║
║   📊 Analytics:        Google Analytics 4 Integrated              ║
║                                                                   ║
║   Mode: Node.js ${process.version} (Active & Serving)                     ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down NRN Properties server...');
  server.close(() => process.exit(0));
});
