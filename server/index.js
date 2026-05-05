const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data', 'ticketMachines.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========== JSON File Helpers ==========

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    // Auto-seed with initial data on first run
    const seed = require('./seed-data');
    writeData(seed);
    return seed;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeData(items) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

// ========== API Routes ==========

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'IT-Repair Backend API (JSON Storage)',
    version: '1.0.0',
    endpoints: {
      ticketMachines: '/api/ticket-machines',
      stats: '/api/ticket-machines/stats',
    }
  });
});

// GET all
app.get('/api/ticket-machines', (req, res) => {
  try {
    const items = readData();
    const { search, location } = req.query;

    let filtered = items;

    if (location && location !== 'ALL') {
      filtered = filtered.filter(i => i.location === location);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(i =>
        i.serialNumber.toLowerCase().includes(q) ||
        i.deviceName.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q) ||
        (i.notes || '').toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด', details: err.message });
  }
});

// GET stats
app.get('/api/ticket-machines/stats', (req, res) => {
  try {
    const items = readData();
    const locations = [...new Set(items.map(i => i.location))];
    const devices = [...new Set(items.map(i => i.deviceName))];
    res.json({
      total: items.length,
      locations: locations.length,
      devices: devices.length,
      locationList: locations.sort(),
      deviceList: devices.sort(),
    });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด', details: err.message });
  }
});

// GET by id
app.get('/api/ticket-machines/:id', (req, res) => {
  try {
    const items = readData();
    const item = items.find(i => i._id === req.params.id);
    if (!item) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด', details: err.message });
  }
});

// POST create
app.post('/api/ticket-machines', (req, res) => {
  try {
    const items = readData();
    const newItem = {
      _id: generateId(),
      serialNumber: req.body.serialNumber,
      purchaseDate: req.body.purchaseDate,
      notes: req.body.notes || '',
      deviceName: req.body.deviceName,
      location: req.body.location,
      status: req.body.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    items.push(newItem);
    writeData(items);
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: 'ไม่สามารถเพิ่มข้อมูลได้', details: err.message });
  }
});

// PUT update
app.put('/api/ticket-machines/:id', (req, res) => {
  try {
    const items = readData();
    const idx = items.findIndex(i => i._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'ไม่พบข้อมูล' });

    items[idx] = {
      ...items[idx],
      ...req.body,
      _id: items[idx]._id,
      updatedAt: new Date().toISOString(),
    };
    writeData(items);
    res.json(items[idx]);
  } catch (err) {
    res.status(400).json({ error: 'ไม่สามารถแก้ไขข้อมูลได้', details: err.message });
  }
});

// DELETE
app.delete('/api/ticket-machines/:id', (req, res) => {
  try {
    const items = readData();
    const idx = items.findIndex(i => i._id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'ไม่พบข้อมูล' });

    items.splice(idx, 1);
    writeData(items);
    res.json({ message: 'ลบข้อมูลสำเร็จ', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'ไม่สามารถลบข้อมูลได้', details: err.message });
  }
});

// POST reset - รีเซ็ตข้อมูลเป็นค่าเริ่มต้น
app.post('/api/ticket-machines/reset', (req, res) => {
  try {
    const seed = require('./seed-data');
    writeData(seed);
    res.json({ message: 'รีเซ็ตข้อมูลเรียบร้อย', total: seed.length });
  } catch (err) {
    res.status(500).json({ error: 'ไม่สามารถรีเซ็ตได้', details: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 IT-Repair API running on port ${PORT}`);
  console.log(`📁 Data file: ${DATA_FILE}`);
  // Ensure data exists on startup
  const items = readData();
  console.log(`✅ Loaded ${items.length} ticket machines`);
});
