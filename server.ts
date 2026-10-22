import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import { createServer as createViteServer } from 'vite';

const app = express();
// The dev server inside the container must bind strictly to port 3000 where Nginx reverse-proxies
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cryptographic JWT Sign & Verify using MTA_JWT_SECRET
function getJwtSecret(): string | null {
  const secret = (process.env.MTA_JWT_SECRET || '').trim();
  return secret.length >= 32 ? secret : null;
}

function signJwt(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = getJwtSecret();
  if (!secret) throw new Error('MTA_JWT_SECRET must be configured with at least 32 characters');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token: string): Record<string, any> | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;

  try {
    const parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf-8'));
    if (
      !parsedHeader ||
      parsedHeader.alg !== 'HS256' ||
      parsedHeader.typ !== 'JWT'
    ) {
      return null;
    }
  } catch {
    return null;
  }

  const secret = getJwtSecret();
  if (!secret) return null;
  const expectedSig = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');

  if (signature.length !== expectedSig.length) return null;
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.sub !== 'string' ||
      payload.sub.trim().length === 0 ||
      payload.role !== 'admin' ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= Date.now() ||
      !Number.isFinite(payload.iat) ||
      payload.iat > Date.now() + 60_000
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// In-Memory Persistent Store with Initial Production Seed Data
let remoteConfigData = {
  announcement: {
    enabled: true,
    textAr: "أهلاً بكم في تطبيق MTA Net blocker — جدار الحماية المحلي الأقوى لعزل التطبيقات ومنع تسريب بيانات الإنترنت محلياً بدون خوادم وسيطة.",
    textEn: "Welcome to MTA Net blocker — The zero-leak local firewall for per-app network isolation.",
    speed: 40
  },
  contact: {
    email: "hoaam100@gmail.com",
    emailEnabled: true,
    whatsappNumber: "739979559",
    whatsappCountryCode: "+967",
    whatsappEnabled: true
  },
  features: {
    enableVideoAds: true,
    enableFloatingSpeedMeter: true,
    strictDnsSinkhole: true
  }
};

let advertisementsList = [
  {
    id: "ad-001",
    title: "MTA Ultra Security Suite",
    description: "Next-generation mobile network intelligence and local packet isolation for high-security environments.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    targetUrl: "https://mta-blocker.example.com/security",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    priority: 10,
    active: true
  },
  {
    id: "ad-002",
    title: "Zero-Trace Bandwidth Optimization",
    description: "Save up to 45% mobile data by muting rogue background tracking and background telemetry.",
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
    targetUrl: "https://mta-blocker.example.com/data-saver",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    priority: 5,
    active: true
  }
];

let appVersionData = {
  latestVersionCode: 1,
  latestVersionName: "1.0.0",
  minSupportedVersionCode: 1,
  releaseNotesEn: "Initial production release of MTA Net blocker. Includes dual-stack IPv4/IPv6 packet filtering, real-time speed monitor, and remote configuration syncing.",
  releaseNotesAr: "الإطلاق الإنتاجي الأول لتطبيق MTA Net blocker. يتضمن التصفية المزدوجة لحزم IPv4/IPv6، ومراقب السرعة الحي، ومزامنة الإعلانات والتكوين عن بُعد.",
  downloadUrl: "https://github.com/mta-netblocker/releases/download/v1.0.0/mta-netblocker-v1.0.0-release.apk",
  sha256Checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  isMandatory: false,
  publishedAt: "2026-10-18T10:00:00Z"
};

// ==========================================
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'server_db.json');

function savePersistentStore() {
fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
const tempFile = STORE_FILE + '.' + process.pid + '.tmp';
fs.writeFileSync(tempFile, JSON.stringify({
remoteConfigData,
advertisementsList,
appVersionData
}, null, 2), { encoding: 'utf8', mode: 0o600 });
fs.renameSync(tempFile, STORE_FILE);
}

function loadPersistentStore() {
if (!fs.existsSync(STORE_FILE)) {
savePersistentStore();
console.log('[MTA Server] Initial persistent data file created.');
return;
}
const saved = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
if (!saved || typeof saved !== 'object' ||
!saved.remoteConfigData || !Array.isArray(saved.advertisementsList) ||
!saved.appVersionData) {
throw new Error('Persistent data file has an invalid structure; refusing to overwrite it.');
}
remoteConfigData = saved.remoteConfigData;
advertisementsList = saved.advertisementsList;
appVersionData = saved.appVersionData;
console.log('[MTA Server] Persistent data loaded.');
}

loadPersistentStore();

// PUBLIC REST API ENDPOINTS
// ==========================================

// GET /api/v1/config
app.get('/api/v1/config', (req, res) => {
  res.json(remoteConfigData);
});

// GET /api/v1/ads
app.get('/api/v1/ads', (req, res) => {
  const dateParts = new Intl.DateTimeFormat('en', {
timeZone: 'Asia/Aden',
year: 'numeric',
month: '2-digit',
day: '2-digit'
}).formatToParts(new Date());
  const today = `${dateParts.find(p => p.type === 'year')?.value}-${dateParts.find(p => p.type === 'month')?.value}-${dateParts.find(p => p.type === 'day')?.value}`;
const publishedAds = advertisementsList
.filter(ad =>
ad.active &&
(!ad.startDate || ad.startDate <= today) &&
(!ad.endDate || ad.endDate >= today)
)
.sort((a, b) => b.priority - a.priority);
  res.json({ ads: publishedAds });
});

// GET /api/v1/app-version
app.get('/api/v1/app-version', (req, res) => {
  res.json(appVersionData);
});

// ==========================================
// AUTHENTICATION & PROTECTED ADMIN ENDPOINTS
// ==========================================

// GET /api/v1/auth/status: Validate configuration without exposing secret values
app.get('/api/v1/auth/status', (req, res) => {
  const configuredUser = (process.env.MTA_ADMIN_USERNAME || '').trim();
  const configuredPass = process.env.MTA_ADMIN_PASSWORD || '';
  const hasValidJwtSecret = getJwtSecret() !== null;

  res.json({
    initialized: true,
    authConfigured: configuredUser.length > 0 && configuredPass.length > 0 && hasValidJwtSecret,
    hasJwtSecret: hasValidJwtSecret,
    configuredUsername: configuredUser || null
  });
});

// POST /api/v1/admin/login
app.post('/api/v1/admin/login', (req, res) => {
  const { username, password } = req.body || {};
  const configuredUser = (process.env.MTA_ADMIN_USERNAME || '').trim();
  const configuredPass = process.env.MTA_ADMIN_PASSWORD || '';

  const inputUser = typeof username === 'string' ? username.trim() : '';
  const inputPass = typeof password === 'string' ? password : '';

  if (!configuredUser || !configuredPass || !getJwtSecret()) {
    return res.status(503).json({ error: "Administrator authentication is not configured" });
  }

  const isUserValid = inputUser.toLowerCase() === configuredUser.toLowerCase();
  const isPassValid = inputPass === configuredPass;

  if (!isUserValid || !isPassValid) {
    return res.status(401).json({ error: "Invalid administrator credentials" });
  }

  const token = signJwt({
    sub: configuredUser,
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days expiration
  });

  return res.json({
    success: true,
    token,
    admin: {
      username: configuredUser,
      role: "Administrator"
    }
  });
});

// GET /api/v1/admin/me: Verify active session token
app.get('/api/v1/admin/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-admin-token'] as string || '');

  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ authenticated: false, error: "Unauthorized or invalid session" });
  }

  return res.json({
    authenticated: true,
    user: payload.sub,
    role: payload.role
  });
});

// Protect all admin endpoints registered below this middleware.
// Login and session verification are handled by their dedicated routes above.
app.use('/api/v1/admin', (req, res, next) => {
  if (req.path === '/login' && req.method === 'POST') return next();
  if (req.path === '/me' && req.method === 'GET') return next();

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-admin-token'] as string || '');

  const payload = verifyJwt(token);
  if (!payload || payload.role !== 'admin' || !payload.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
});

// GET /api/v1/admin/ads
app.get('/api/v1/admin/ads', (req, res) => {
  res.json({ ads: advertisementsList });
});

// POST /api/v1/admin/ads
app.post('/api/v1/admin/ads', (req, res) => {
  const newAd = {
    id: "ad-" + Date.now(),
    title: req.body.title || "Untitled Ad",
    description: req.body.description || "",
    mediaType: req.body.mediaType || "image",
    mediaUrl: req.body.mediaUrl || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
    targetUrl: req.body.targetUrl || "",
    startDate: req.body.startDate || new Date().toISOString().split('T')[0],
    endDate: req.body.endDate || "2027-12-31",
    priority: Number(req.body.priority) || 1,
    active: req.body.active !== false
  };
  advertisementsList.unshift(newAd);
  savePersistentStore();
  res.json({ success: true, ad: newAd });
});

// PUT /api/v1/admin/ads/:id
app.put('/api/v1/admin/ads/:id', (req, res) => {
  const adIndex = advertisementsList.findIndex(a => a.id === req.params.id);
  if (adIndex === -1) return res.status(404).json({ error: "Advertisement not found" });

  advertisementsList[adIndex] = {
    ...advertisementsList[adIndex],
    ...req.body
  };
  savePersistentStore();
  res.json({ success: true, ad: advertisementsList[adIndex] });
});

// DELETE /api/v1/admin/ads/:id
app.delete('/api/v1/admin/ads/:id', (req, res) => {
  advertisementsList = advertisementsList.filter(a => a.id !== req.params.id);
  savePersistentStore();
  res.json({ success: true });
});

// POST /api/v1/admin/announcement
app.post('/api/v1/admin/announcement', (req, res) => {
  remoteConfigData.announcement = {
    ...remoteConfigData.announcement,
    ...req.body
  };
  savePersistentStore();
  res.json({ success: true, announcement: remoteConfigData.announcement });
});

// POST /api/v1/admin/contacts
app.post('/api/v1/admin/contacts', (req, res) => {
  remoteConfigData.contact = {
    ...remoteConfigData.contact,
    ...req.body
  };
  savePersistentStore();
  res.json({ success: true, contact: remoteConfigData.contact });
});

// POST /api/v1/admin/version
app.post('/api/v1/admin/version', (req, res) => {
  appVersionData = {
    ...appVersionData,
    ...req.body,
    publishedAt: new Date().toISOString()
  };
  savePersistentStore();
  res.json({ success: true, version: appVersionData });
});

// GET /api/v1/admin/stats
app.get('/api/v1/admin/stats', (req, res) => {
  res.json({
    activeAdsCount: advertisementsList.filter(a => a.active).length,
    totalAdsCount: advertisementsList.length,
    latestVersion: appVersionData.latestVersionName,
    announcementStatus: remoteConfigData.announcement.enabled ? "Active" : "Disabled",
    contactEmail: remoteConfigData.contact.email,
    contactWhatsApp: `${remoteConfigData.contact.whatsappCountryCode} ${remoteConfigData.contact.whatsappNumber}`,
    serverTimestamp: new Date().toISOString()
  });
});

// ==========================================
// DOWNLOAD FULL REPOSITORY ZIP ARCHIVE
// Admin-only; sensitive files and backups are excluded.
// ==========================================
app.get('/api/download-zip', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-admin-token'] as string || '');
  const payload = verifyJwt(token);

  if (!payload || payload.role !== 'admin' || !payload.sub) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const zip = new AdmZip();
    const rootDir = process.cwd();

    const excludedNames = new Set([
      'node_modules', '.git', '.cache', 'dist', '.aistudio',
      '.gradle', 'build', 'data', 'coverage', 'local.properties', '.npmrc',
      '.pypirc', '.netrc'
    ]);

    function shouldExclude(item: string): boolean {
      const lower = item.toLowerCase();
      return excludedNames.has(item) ||
        lower.startsWith('.env') ||
        lower.endsWith('.bak') ||
        ['.jks', '.keystore', '.pem', '.key', '.p12', '.pfx',
         '.sqlite', '.sqlite3', '.db'].some(ext => lower.endsWith(ext)) ||
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.startsWith('id_rsa');
    }

    function addDirToZip(currentPath: string, zipPath: string) {
      for (const item of fs.readdirSync(currentPath)) {
        if (shouldExclude(item)) continue;

        const fullPath = path.join(currentPath, item);
        const stat = fs.lstatSync(fullPath);
        if (stat.isSymbolicLink()) continue;

        if (stat.isDirectory()) {
          addDirToZip(fullPath, path.join(zipPath, item));
        } else if (stat.isFile()) {
          zip.addLocalFile(fullPath, zipPath);
        }
      }
    }

    addDirToZip(rootDir, '');

    const buffer = zip.toBuffer();
    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', 'attachment; filename="mta-netblocker-production-project.zip"');
    res.set('Content-Length', buffer.length.toString());
    res.send(buffer);
  } catch (err) {
    console.error('ZIP creation error:', err);
    res.status(500).json({ error: 'Failed to create project ZIP archive' });
  }
});

// Vite middleware integration for SPA serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[MTA Server] Running on http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch(err => {
  console.error("Server initialization error:", err);
});
