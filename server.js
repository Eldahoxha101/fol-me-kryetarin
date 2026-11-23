import http from 'http';
import fs from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const IS_VERCEL = Boolean(process.env.VERCEL);
const VERCEL_DATA_DIR = path.join('/tmp', 'data');
const VERCEL_UPLOADS_DIR = path.join('/tmp', 'uploads');

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Data Helper Functions (with Vercel Serverless /tmp compatibility)
async function readData(filename) {
  if (IS_VERCEL) {
    await ensureDir(VERCEL_DATA_DIR);
    const vercelFile = path.join(VERCEL_DATA_DIR, filename);
    if (existsSync(vercelFile)) {
      try {
        const raw = await fs.readFile(vercelFile, 'utf-8');
        return JSON.parse(raw);
      } catch (e) {}
    }
    // Seed from local repository data directory
    const seedFile = path.join(DATA_DIR, filename);
    try {
      const raw = await fs.readFile(seedFile, 'utf-8');
      const parsed = JSON.parse(raw);
      await fs.writeFile(vercelFile, raw, 'utf-8');
      return parsed;
    } catch (e) {
      return [];
    }
  }

  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

async function writeData(filename, data) {
  const targetDir = IS_VERCEL ? VERCEL_DATA_DIR : DATA_DIR;
  await ensureDir(targetDir);
  const filePath = path.join(targetDir, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Request parser
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 25 * 1024 * 1024) { // 25MB limit for images
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

// HTTP Request Handler
export async function handleRequest(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const searchParams = parsedUrl.searchParams;

  // -------------------------------------------------------------
  // API ROUTING
  // -------------------------------------------------------------
  try {
    // -------------------------------------------------------------
    // AUTHENTICATION API (GOOGLE SIGN-IN & REGISTRATION)
    // -------------------------------------------------------------
    // 0.1 Check current user or session
    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const email = searchParams.get('email');
      const userId = searchParams.get('userId');
      const users = await readData('users.json');

      const found = users.find(u => (userId && u.id === userId) || (email && u.email === email));
      if (found) {
        return sendJson(res, 200, { success: true, user: found });
      }
      return sendJson(res, 200, { success: false, user: null });
    }

    // 0.2 Google Sign-in Initiation
    if (pathname === '/api/auth/google' && req.method === 'POST') {
      const body = await parseBody(req);
      const email = (body.email || '').trim().toLowerCase();
      if (!email) {
        return sendJson(res, 400, { error: 'Email-i i Google është i detyrueshëm.' });
      }

      const users = await readData('users.json');
      const existingUser = users.find(u => u.email.toLowerCase() === email || (body.googleId && u.googleId === body.googleId));

      // If user exists and already has both full name and phone number, they are fully registered
      if (existingUser && existingUser.phone && existingUser.fullName) {
        const token = crypto.createHash('sha256').update(`${existingUser.id}-${Date.now()}`).digest('hex');
        return sendJson(res, 200, {
          success: true,
          isNew: false,
          needsCompletion: false,
          user: existingUser,
          token
        });
      }

      // User is either new or needs to complete phone/name registration
      return sendJson(res, 200, {
        success: true,
        isNew: !existingUser,
        needsCompletion: true,
        tempUser: {
          email,
          fullName: (existingUser && existingUser.fullName) || body.fullName || body.name || '',
          avatarUrl: (existingUser && existingUser.avatarUrl) || body.avatarUrl || body.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
          googleId: body.googleId || `g-${Date.now()}`
        }
      });
    }

    // 0.3 Complete Registration (Name + Phone number)
    if (pathname === '/api/auth/complete-registration' && req.method === 'POST') {
      const body = await parseBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const fullName = (body.fullName || '').trim();
      const phone = (body.phone || '').trim();

      if (!email || !fullName || !phone) {
        return sendJson(res, 400, { error: 'Ju lutem plotësoni Emrin e saktë dhe Numrin e telefonit.' });
      }

      const users = await readData('users.json');
      let userIdx = users.findIndex(u => u.email.toLowerCase() === email);

      const updatedUser = {
        id: userIdx !== -1 ? users[userIdx].id : `usr-${Date.now()}`,
        googleId: body.googleId || (userIdx !== -1 ? users[userIdx].googleId : `g-${Date.now()}`),
        email,
        fullName,
        phone,
        city: (body.city || '').trim(),
        avatarUrl: body.avatarUrl || (userIdx !== -1 ? users[userIdx].avatarUrl : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'),
        isVerified: true,
        registeredAt: userIdx !== -1 ? (users[userIdx].registeredAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (userIdx !== -1) {
        users[userIdx] = updatedUser;
      } else {
        users.unshift(updatedUser);
      }

      await writeData('users.json', users);
      const token = crypto.createHash('sha256').update(`${updatedUser.id}-${Date.now()}`).digest('hex');

      return sendJson(res, 200, {
        success: true,
        message: 'Regjistrimi u krye me sukses të plotë!',
        user: updatedUser,
        token
      });
    }

    // 0.4 My Inquiries
    if (pathname === '/api/user/my-inquiries' && req.method === 'GET') {
      const email = (searchParams.get('email') || '').toLowerCase();
      const userId = searchParams.get('userId');
      const inquiries = await readData('inquiries.json');

      const myInqs = inquiries.filter(i => 
        (userId && i.userId === userId) || 
        (email && (i.senderEmail || '').toLowerCase() === email)
      );
      return sendJson(res, 200, myInqs);
    }

    // 1. Config API (Site Customizer)
    if (pathname === '/api/config') {
      if (req.method === 'GET') {
        const config = await readData('config.json');
        return sendJson(res, 200, config);
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const currentConfig = await readData('config.json');
        const updatedConfig = { ...currentConfig, ...body };
        await writeData('config.json', updatedConfig);
        return sendJson(res, 200, { success: true, config: updatedConfig });
      }
    }

    // 1.1 Image Upload API (Base64)
    if (pathname === '/api/upload' && req.method === 'POST') {
      const body = await parseBody(req);
      if (!body.fileName || !body.fileData) {
        return sendJson(res, 400, { error: 'Ju lutem ngarkoni një skedar të vlefshëm.' });
      }

      const uploadsDir = IS_VERCEL ? VERCEL_UPLOADS_DIR : path.join(PUBLIC_DIR, 'uploads');
      await ensureDir(uploadsDir);

      const ext = path.extname(body.fileName).toLowerCase() || '.jpg';
      const cleanName = path.basename(body.fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueName = `${cleanName}-${Date.now()}${ext}`;
      const targetFilePath = path.join(uploadsDir, uniqueName);

      const base64Data = body.fileData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      await fs.writeFile(targetFilePath, buffer);

      const fileUrl = `uploads/${uniqueName}`;
      return sendJson(res, 200, { success: true, url: fileUrl, fileName: uniqueName });
    }

    // 1.2 Media Library API (Lists all uploaded and brand images)
    if (pathname === '/api/media' && req.method === 'GET') {
      const uploadsDir = IS_VERCEL ? VERCEL_UPLOADS_DIR : path.join(PUBLIC_DIR, 'uploads');
      const brandDir = path.join(PUBLIC_DIR, 'brand');
      
      const media = [];
      if (existsSync(uploadsDir)) {
        const upFiles = await fs.readdir(uploadsDir);
        for (const f of upFiles) {
          media.push({ name: f, url: `uploads/${f}`, type: 'upload' });
        }
      }
      if (existsSync(brandDir)) {
        const brFiles = await fs.readdir(brandDir);
        for (const f of brFiles) {
          media.push({ name: f, url: `brand/${f}`, type: 'brand' });
        }
      }
      return sendJson(res, 200, media);
    }

    // 2. Profiles API
    if (pathname === '/api/profiles') {
      if (req.method === 'GET') {
        const profiles = await readData('profiles.json');
        const inquiries = await readData('inquiries.json');
        
        // Enrich profiles with dynamic counts
        const enriched = profiles.map(p => {
          const profInqs = inquiries.filter(i => i.profileId === p.id);
          const answered = profInqs.filter(i => i.status === 'answered').length;
          return {
            ...p,
            totalInquiries: profInqs.length,
            answeredInquiries: answered
          };
        });
        return sendJson(res, 200, enriched);
      }

      if (req.method === 'POST') {
        const body = await parseBody(req);
        const profiles = await readData('profiles.json');
        const newProfile = {
          id: `prof-${Date.now()}`,
          slug: (body.fullName || 'profil').toLowerCase().replace(/[^a-z0-9]/g, '-'),
          fullName: body.fullName || 'Profil i Ri',
          role: body.role || 'Përfaqësues',
          avatarUrl: body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          bio: body.bio || '',
          isAvailable: body.isAvailable ?? true,
          categories: Array.isArray(body.categories) ? body.categories : ['Të Përgjithshme'],
          welcomeMessage: body.welcomeMessage || 'Mirësevini në dritaren time të dialogut!',
          responseRate: '100%',
          avgResponseTime: '24 orë'
        };
        profiles.push(newProfile);
        await writeData('profiles.json', profiles);
        return sendJson(res, 201, { success: true, profile: newProfile });
      }
    }

    // Single Profile Update/Delete
    if (pathname.startsWith('/api/profiles/')) {
      const id = pathname.replace('/api/profiles/', '');
      const profiles = await readData('profiles.json');
      const idx = profiles.findIndex(p => p.id === id);

      if (idx === -1) {
        return sendJson(res, 404, { error: 'Profili nuk u gjet' });
      }

      if (req.method === 'PUT') {
        const body = await parseBody(req);
        profiles[idx] = { ...profiles[idx], ...body, id };
        await writeData('profiles.json', profiles);
        return sendJson(res, 200, { success: true, profile: profiles[idx] });
      }

      if (req.method === 'DELETE') {
        profiles.splice(idx, 1);
        await writeData('profiles.json', profiles);
        return sendJson(res, 200, { success: true });
      }
    }

    // 3. Inquiries (Questions & Dialogue) API
    if (pathname === '/api/inquiries') {
      if (req.method === 'GET') {
        const inquiries = await readData('inquiries.json');
        const profileId = searchParams.get('profileId');
        const status = searchParams.get('status');
        const isPublicOnly = searchParams.get('publicOnly') === 'true';

        let filtered = inquiries;
        if (profileId) filtered = filtered.filter(i => i.profileId === profileId);
        if (status) filtered = filtered.filter(i => i.status === status);
        if (isPublicOnly) filtered = filtered.filter(i => i.isPublic === true);

        // Sort latest first
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return sendJson(res, 200, filtered);
      }

      if (req.method === 'POST') {
        const body = await parseBody(req);
        if (!body.profileId || !body.subject || !body.message || !body.senderEmail) {
          return sendJson(res, 400, { error: 'Plotësoni të gjitha fushat e detyrueshme.' });
        }

        const inquiries = await readData('inquiries.json');
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        const trackingCode = `FOL-${randomNum}`;

        const newInquiry = {
          id: `inq-${Date.now()}`,
          trackingCode,
          profileId: body.profileId,
          userId: body.userId || null,
          senderName: body.isAnonymous ? 'Qytetar Anonim' : (body.senderName || 'Qytetar'),
          senderEmail: body.senderEmail,
          senderPhone: body.senderPhone || body.phone || '',
          isAnonymous: Boolean(body.isAnonymous),
          category: body.category || 'Të Përgjithshme',
          subject: body.subject,
          message: body.message,
          attachmentUrl: body.attachmentUrl || null,
          status: 'pending',
          isPublic: false,
          createdAt: new Date().toISOString(),
          response: null
        };

        inquiries.unshift(newInquiry);
        await writeData('inquiries.json', inquiries);

        return sendJson(res, 201, {
          success: true,
          trackingCode,
          message: 'Pyetja juaj u regjistrua me sukses! Ruani kodin për ndjekjen e statusit.',
          inquiry: newInquiry
        });
      }
    }

    // Track inquiry by code
    if (pathname.startsWith('/api/inquiries/track/')) {
      const code = pathname.replace('/api/inquiries/track/', '').trim().toUpperCase();
      const inquiries = await readData('inquiries.json');
      const found = inquiries.find(i => i.trackingCode.toUpperCase() === code);
      if (!found) {
        return sendJson(res, 404, { error: 'Nuk u gjet asnjë dialog me këtë kod ndjekjeje.' });
      }
      return sendJson(res, 200, found);
    }

    // Respond to an inquiry
    if (pathname.match(/^\/api\/inquiries\/[^\/]+\/respond$/)) {
      if (req.method === 'PUT') {
        const id = pathname.split('/')[3];
        const body = await parseBody(req);
        const inquiries = await readData('inquiries.json');
        const idx = inquiries.findIndex(i => i.id === id);

        if (idx === -1) {
          return sendJson(res, 404, { error: 'Dialogu nuk u gjet' });
        }

        inquiries[idx].status = body.status || 'answered';
        inquiries[idx].isPublic = Boolean(body.isPublic);
        inquiries[idx].response = {
          answeredBy: body.answeredBy || inquiries[idx].profileId,
          responderName: body.responderName || 'Përgjigje Zyrtare',
          answerText: body.answerText,
          videoUrl: body.videoUrl || null,
          answeredAt: new Date().toISOString()
        };

        await writeData('inquiries.json', inquiries);
        return sendJson(res, 200, { success: true, inquiry: inquiries[idx] });
      }
    }

    // Delete inquiry
    if (pathname.startsWith('/api/inquiries/') && req.method === 'DELETE') {
      const id = pathname.replace('/api/inquiries/', '');
      const inquiries = await readData('inquiries.json');
      const updated = inquiries.filter(i => i.id !== id);
      await writeData('inquiries.json', updated);
      return sendJson(res, 200, { success: true });
    }

    // 4. Statistics API
    if (pathname === '/api/stats' && req.method === 'GET') {
      const inquiries = await readData('inquiries.json');
      const profiles = await readData('profiles.json');

      const total = inquiries.length;
      const answered = inquiries.filter(i => i.status === 'answered').length;
      const pending = inquiries.filter(i => i.status === 'pending').length;
      const underReview = inquiries.filter(i => i.status === 'under_review').length;
      const publicFeedCount = inquiries.filter(i => i.isPublic === true).length;

      return sendJson(res, 200, {
        totalInquiries: total,
        answeredInquiries: answered,
        pendingInquiries: pending,
        underReviewInquiries: underReview,
        publicFeedCount,
        profilesCount: profiles.length,
        responseRatePercent: total > 0 ? Math.round((answered / total) * 100) : 100
      });
    }

    // -------------------------------------------------------------
    // STATIC FILE SERVING
    // -------------------------------------------------------------
    let relativePath = pathname.replace(/^\/+/, '');
    if (!relativePath) {
      relativePath = 'index.html';
    }

    // On Vercel: serve uploaded files from /tmp/uploads
    if (pathname.startsWith('/uploads/') && IS_VERCEL) {
      const uploadFile = path.join(VERCEL_UPLOADS_DIR, pathname.replace('/uploads/', ''));
      if (existsSync(uploadFile)) {
        const ext = path.extname(uploadFile).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        createReadStream(uploadFile).pipe(res);
        return;
      }
    }

    const filePath = path.join(PUBLIC_DIR, relativePath);

    if (existsSync(filePath)) {
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        createReadStream(filePath).pipe(res);
        return;
      }
    }

    // Fallback to index.html for SPA feel
    const fallbackIndex = path.join(PUBLIC_DIR, 'index.html');
    if (existsSync(fallbackIndex)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      createReadStream(fallbackIndex).pipe(res);
      return;
    }

    sendJson(res, 404, { error: 'File Not Found' });
  } catch (err) {
    console.error('Server Error:', err);
    sendJson(res, 500, { error: 'Internal Server Error', message: err.message });
  }
}

export default handleRequest;

// If executed directly (node server.js), start HTTP server
if (!IS_VERCEL) {
  const server = http.createServer(handleRequest);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🏛️ FOL ME KRYETARIN · BASHKIA KAMËZ (Rakip Suli)`);
    console.log(`🚀 Serveri po ekzekutohet në: http://localhost:${PORT}`);
    console.log(`📊 Paneli i Administrimit dhe Live Customizer i integruar`);
    console.log(`====================================================`);
  });
}
