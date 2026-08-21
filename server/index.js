const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data', 'app_database.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========== Database Helpers ==========

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readDb() {
  ensureDataDir();
  const seed = require('./seed-data');
  const fullSeed = seed.FULL_SEED || {};

  if (!fs.existsSync(DATA_FILE)) {
    writeDb(fullSeed);
    return fullSeed;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const db = JSON.parse(raw);
    let updated = false;
    
    for (const key of ['tickets', 'stock', 'assets', 'maritime', 'reports', 'folders', 'simCards', 'ticketMachines', 'radioData', 'viabusData', 'cctvData']) {
      if (db[key] === undefined || (Array.isArray(db[key]) && db[key].length === 0 && Array.isArray(fullSeed[key]) && fullSeed[key].length > 0)) {
        db[key] = fullSeed[key];
        updated = true;
      }
    }
    if (updated) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
    }
    return db;
  } catch (e) {
    return fullSeed;
  }
}

function writeDb(db) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  // Broadcast updated database to all connected clients
  io.emit('database_updated', db);
}

// ========== Google Sheets Integration ==========
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1M6f-xHA9E0mqdTbvIFkROLbL4d6gJaC0JC8QRhHYmh0/export?format=csv&gid=2077750642';

async function syncWithGoogleSheets() {
  try {
    console.log('🔄 Syncing with Google Sheets...');
    const response = await fetch(SHEET_CSV_URL);
    if (!response.ok) throw new Error('Failed to fetch sheet');
    const csv = await response.text();
    
    // Simple CSV parser (assuming comma separated and quoted)
    const lines = csv.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length <= 1) return; // Only header

    const db = readDb();
    let addedCount = 0;

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, ''));
      const [timestamp, reporter, message, , , , rawStatus] = parts;
      if (!message || !reporter) continue;
      
      let status = 'PENDING';
      if (rawStatus) {
        if (rawStatus.includes('กำลังแก้ไข')) status = 'IN_PROGRESS';
        else if (rawStatus.includes('เสร็จ') || rawStatus.includes('เรียบร้อย')) status = 'COMPLETED';
      }

      // Use message and reporter as unique key
      const existing = db.tickets.find(t => 
        t.issueDescription === message && t.contactName === reporter
      );

      if (!existing) {
        let parsedTimestamp = new Date().toISOString();
        try {
          const d = new Date(timestamp);
          if (!isNaN(d.getTime())) parsedTimestamp = d.toISOString();
        } catch (e) {}

        db.tickets.push({
          id: `sheet_${Date.now()}_${i}`,
          deviceType: 'EXTERNAL',
          deviceId: 'SHEET_FORM',
          issueDescription: message,
          contactName: reporter,
          status: status,
          timestamp: parsedTimestamp,
          location: 'แจ้งผ่าน Google Form'
        });
        addedCount++;
      } else if (existing.deviceId === 'SHEET_FORM' && existing.status !== status) {
        existing.status = status;
        addedCount++; // treat updates as changes to persist
      }
    }

    if (addedCount > 0) {
      writeDb(db);
      console.log(`✅ Synced ${addedCount} changes from Google Sheets`);
    }
  } catch (err) {
    console.error('❌ Google Sheets Sync Error:', err);
  }
}

// ========== Universal API Routes ==========

// GET all data (Initial Sync)
app.get('/api/sync', async (req, res) => {
  await syncWithGoogleSheets();
  res.json(readDb());
});

// POST sync all data (Bulk Save)
app.post('/api/sync', (req, res) => {
  try {
    const db = readDb();
    const updatedDb = { ...db, ...req.body };
    writeDb(updatedDb);
    res.json({ status: 'success', message: 'Data synced successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed', details: err.message });
  }
});

// ========== Existing Ticket Machine Routes (For compatibility) ==========

app.get('/api/ticket-machines', (req, res) => {
  const db = readDb();
  res.json(db.ticketMachines || []);
});

app.post('/api/ticket-machines', (req, res) => {
  const db = readDb();
  const newItem = { _id: crypto.randomBytes(12).toString('hex'), ...req.body };
  db.ticketMachines.push(newItem);
  writeDb(db);
  res.status(201).json(newItem);
});

app.put('/api/ticket-machines/:id', (req, res) => {
  const db = readDb();
  const idx = db.ticketMachines.findIndex(i => i._id === req.params.id || i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.ticketMachines[idx] = { ...db.ticketMachines[idx], ...req.body };
  writeDb(db);
  res.json(db.ticketMachines[idx]);
});

app.delete('/api/ticket-machines/:id', (req, res) => {
  const db = readDb();
  db.ticketMachines = db.ticketMachines.filter(i => i._id !== req.params.id && i.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

app.post('/api/ticket-machines/reset', (req, res) => {
  const db = readDb();
  const seed = require('./seed-data');
  db.ticketMachines = seed.SEED_DATA || seed.FULL_SEED?.ticketMachines || [];
  writeDb(db);
  res.json({ message: 'Reset successful', total: db.ticketMachines.length });
});

// ========== WebSockets (Real-time) ==========
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start
server.listen(PORT, () => {
  console.log(`🚀 IT-Repair Server running on port ${PORT}`);
  console.log(`💾 Database: ${DATA_FILE}`);
});
