const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
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
  if (!fs.existsSync(DATA_FILE)) {
    // Initial empty database structure
    const initialDb = {
      tickets: [],
      stock: [],
      assets: [],
      maritime: [],
      reports: [],
      folders: [],
      simCards: [],
      ticketMachines: require('./seed-data') // Use existing seed for machines
    };
    writeDb(initialDb);
    return initialDb;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function writeDb(db) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

// ========== Universal API Routes ==========

// GET all data (Initial Sync)
app.get('/api/sync', (req, res) => {
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
  db.ticketMachines = require('./seed-data');
  writeDb(db);
  res.json({ message: 'Reset successful', total: db.ticketMachines.length });
});

// Start
app.listen(PORT, () => {
  console.log(`🚀 IT-Repair Server running on port ${PORT}`);
  console.log(`💾 Database: ${DATA_FILE}`);
});
