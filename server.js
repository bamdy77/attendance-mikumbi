/**
 * ============================================================
 * BACKEND SERVER - Mfumo wa Mahudhurio
 * Shule ya Sendari Mikumbi
 * ============================================================
 * 
 * Mahitaji: Node.js v18+
 * Kuanzisha: node server.js
 * 
 * npm install express cors bcryptjs jsonwebtoken sqlite3 express-rate-limit
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'kubadilisha-hii-kwa-neno-la-siri-imara-2026';

// ============================================================
// CONFIGURATION 
// ============================================================
const CONFIG = {
  SCHOOL_LAT: -10.561915,        // ← Latitude ya shule
  SCHOOL_LNG: 39.178560,         // ← Longitude ya shule
  SCHOOL_RADIUS_M:  70,           // Mita 70
  DEADLINE_HOUR: 7,              // 7:30 AM = Saa 1:30 asubuhi
  DEADLINE_MIN: 30,
  SCHOOL_WIFI_MAC: 'd8:93:d4:2a:ac:bc', // ← MAC address ya router
  SCHOOL_WIFI_SSID: 'm2pa49',       // ← Jina la WiFi
  SCHOOL_SUBNET: '10.234.149',    // ← Subnet ya network ya shule (kwa IP check)
};

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rate limiting - kuzuia spam
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // dakika 15
  max: 20,
  message: { error: 'Maombi mengi sana. Subiri dakika 15.' }
});

app.use('/api/attendance', limiter);

// ============================================================
// DATABASE SETUP (SQLite)
// ============================================================
const db = new sqlite3.Database('./mahudhurio.db', err => {
  if (err) console.error('DB Error:', err);
  else console.log('✅ Database imeunganishwa');
});

db.serialize(() => {

  // Jedwali la Walimu
  db.run(`CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    middle_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    role TEXT DEFAULT 'Mwalimu',
    password_hash TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Jedwali la Mahudhurio
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_id INTEGER NOT NULL,
    teacher_name TEXT NOT NULL,
    subject TEXT,
    date TEXT NOT NULL,
    time_str TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_late INTEGER DEFAULT 0,
    latitude REAL,
    longitude REAL,
    distance_m INTEGER,
    wifi_ssid TEXT,
    ip_address TEXT,
    device_info TEXT,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    UNIQUE(teacher_id, date)
  )`);

  // Jedwali la Admini
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Ongeza admin wa awali (admin / admin123) - BADILISHA mara moja!
  const adminHash = bcrypt.hashSync('octavian@2026', 10);
  db.run(`INSERT OR IGNORE INTO admins (username, password_hash, name) VALUES (?, ?, ?)`,
    ['millanzi', adminHash, 'Mkuu wa Shule']);

  // kuongeza walimu wa demo
  const teachers = [
    ['DEOGRATIUS', 'ROBERT', 'MUZO', 'History', 'Mhasibu'],
    ['OCTAVIAN', 'CONRAD', 'MILLANZI', 'Geography', 'Mkuu wa shule'],
    ['TEOFRID', 'TIMOTEO', 'KWENGA', 'Economics', 'Mwalimu'],
    ['LINUS', 'SAMORA', 'MADAMA', 'Mathematics', 'Mtaaluma Msaidizi'],
    ['ENOCK', 'SOSPETER', 'MATHAYO', 'Physics', 'Mwalimu wa Nidhamu'],
    ['IGNATIO', 'BEYANGA', 'EZEKIEL', 'Biology', 'Makamu wa Shule'],
    ['CHRISTOM', 'KASIAN', 'KOMBA', 'English', 'Mtaaluma Mwandamizi'],
    ['FELISTA', 'DONALD', 'MOHAMED', 'Chemistry', 'Mwalimu wa afya'],
    ['AHMAD', 'MOHAMED', 'VINDILI', 'Chemistry', 'Mwalimu wa Michezo'],
  ];

  teachers.forEach(([fn, mn, ln, sub, role]) => {
    const hash = bcrypt.hashSync('1234', 10);
    db.run(`INSERT OR IGNORE INTO teachers (first_name, middle_name, last_name, subject, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)`,
      [fn, mn, ln, sub, role, hash]);
  });
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function isLate() {
  const now = new Date();
  const deadline = new Date(now);
  deadline.setHours(CONFIG.DEADLINE_HOUR, CONFIG.DEADLINE_MIN, 0, 0);
  return now > deadline;
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}`;
}

function formatDate(date) {
  const days = ['Jumapili','Jumatatu','Jumanne','Jumatano','Alhamisi','Ijumaa','Jumamosi'];
  const months = ['Januari','Februari','Machi','Aprili','Mei','Juni','Julai','Agosti','Septemba','Oktoba','Novemba','Desemba'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// JWT middleware
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token haipo' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token si sahihi' });
  }
}

// ============================================================
// API ROUTES
// ============================================================

// WiFi check - Client anaomba hii kuona kama yuko kwenye network ya shule
app.get('/api/wifi-check', (req, res) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const isSchoolNetwork = clientIP.startsWith(CONFIG.SCHOOL_SUBNET) || clientIP.includes('127.0.0.1') || clientIP.includes('::1');
  res.json({
    ok: true,
    isSchoolNetwork,
    message: isSchoolNetwork ? 'Uko kwenye network ya shule' : 'Huko kwenye network ya shule',
    // Kwa MAC check ya kweli unahitaji ARP table au UniFi API
    ssid: CONFIG.SCHOOL_WIFI_SSID
  });
});

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Jaza sehemu zote' });

  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err || !admin) return res.status(401).json({ error: 'Jina au neno la siri si sahihi' });
    if (!bcrypt.compareSync(password, admin.password_hash))
      return res.status(401).json({ error: 'Jina au neno la siri si sahihi' });

    const token = jwt.sign({ id: admin.id, username: admin.username, name: admin.name }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, name: admin.name, username: admin.username });
  });
});

// POST /api/attendance —
app.post('/api/attendance', (req, res) => {
  const { firstName, middleName, lastName, password, lat, lng, wifiSSID } = req.body;

  if (!firstName || !middleName || !lastName || !password) {
    return res.status(400).json({ ok: false, error: 'Jaza sehemu zote' });
  }

  if (!lat || !lng) {
    return res.status(400).json({ ok: false, error: 'GPS inahitajika. Washa GPS na ujaribu tena.' });
  }

  // kungalia umbali kutoka shuleni
  const distance = haversineDistance(lat, lng, CONFIG.SCHOOL_LAT, CONFIG.SCHOOL_LNG);
  if (distance > CONFIG.SCHOOL_RADIUS_M) {
    return res.status(403).json({
      ok: false,
      error: `Uko nje ya eneo la shule. Umbali wako ni mita ${Math.round(distance)} kutoka shuleni. Karibia hadi mita ${CONFIG.SCHOOL_RADIUS_M} ili uweze kusajili.`
    });
  }

  // Tafuta mwalimu
  const fn = firstName.toUpperCase().trim();
  const mn = middleName.toUpperCase().trim();
  const ln = lastName.toUpperCase().trim();

  db.get(
    'SELECT * FROM teachers WHERE first_name = ? AND middle_name = ? AND last_name = ? AND is_active = 1',
    [fn, mn, ln],
    (err, teacher) => {
      if (err) return res.status(500).json({ ok: false, error: 'Tatizo la seva' });
      if (!teacher) return res.status(401).json({ ok: false, error: 'Jina halipatikani. Angalia tahajia na ujaribu.' });
      if (!bcrypt.compareSync(password, teacher.password_hash))
        return res.status(401).json({ ok: false, error: 'Neno la siri si sahihi.' });

      const today = getTodayDate();
      const now = new Date();
      const late = isLate();
      const timeStr = formatTime(now);
      const dateStr = formatDate(now);
      const teacherName = `${fn} ${mn} ${ln}`;
      const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

      // kungalia kama tayari amesajili leo
      db.get('SELECT id FROM attendance WHERE teacher_id = ? AND date = ?', [teacher.id, today], (err2, existing) => {
        if (existing) {
          return res.status(409).json({
            ok: false,
            error: `Tayari umesajili mahudhurio leo saa ${existing.time_str || '?'}`
          });
        }

        // Hifadhi mahudhurio
        db.run(
          `INSERT INTO attendance (teacher_id, teacher_name, subject, date, time_str, is_late, latitude, longitude, distance_m, wifi_ssid, ip_address, device_info)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [teacher.id, teacherName, teacher.subject, today, timeStr, late ? 1 : 0,
           lat, lng, Math.round(distance), wifiSSID || '', clientIP,
           req.headers['user-agent']?.substring(0, 100) || ''],
          function(err3) {
            if (err3) return res.status(500).json({ ok: false, error: 'Imeshindwa kuhifadhi. Jaribu tena.' });

            res.json({
              ok: true,
              isLate: late,
              teacherName,
              subject: teacher.subject,
              timeStr,
              dateStr,
              distanceM: Math.round(distance),
              message: late ? `Umesajili — Umechelewa! (${timeStr})` : `Umefanikiwa! Umefika kwa wakati. (${timeStr})`
            });
          }
        );
      });
    }
  );
});

// GET /api/attendance/today — Mahudhurio ya leo (Admin)
app.get('/api/attendance/today', authMiddleware, (req, res) => {
  const today = getTodayDate();
  db.all('SELECT * FROM attendance WHERE date = ? ORDER BY timestamp ASC', [today], (err, records) => {
    if (err) return res.status(500).json({ error: 'Tatizo la seva' });

    db.all('SELECT * FROM teachers WHERE is_active = 1', [], (err2, teachers) => {
      if (err2) return res.status(500).json({ error: 'Tatizo la seva' });

      const present = records.map(r => r.teacher_id);
      const result = teachers.map(t => {
        const rec = records.find(r => r.teacher_id === t.id);
        return {
          teacherId: t.id,
          teacherName: `${t.first_name} ${t.middle_name} ${t.last_name}`,
          subject: t.subject,
          role: t.role,
          present: !!rec,
          isLate: rec ? !!rec.is_late : null,
          timeStr: rec ? rec.time_str : null,
          distanceM: rec ? rec.distance_m : null,
          wifiSSID: rec ? rec.wifi_ssid : null,
        };
      });

      res.json({
        date: today,
        total: teachers.length,
        present: present.length,
        absent: teachers.length - present.length,
        late: records.filter(r => r.is_late).length,
        teachers: result
      });
    });
  });
});

// GET /api/attendance/range — Historia (Admin)
app.get('/api/attendance/range', authMiddleware, (req, res) => {
  const { from, to, teacher_id } = req.query;
  let query = 'SELECT * FROM attendance WHERE date >= ? AND date <= ?';
  let params = [from || getTodayDate(), to || getTodayDate()];

  if (teacher_id) {
    query += ' AND teacher_id = ?';
    params.push(teacher_id);
  }

  query += ' ORDER BY date DESC, timestamp ASC';
  db.all(query, params, (err, records) => {
    if (err) return res.status(500).json({ error: 'Tatizo la seva' });
    res.json(records);
  });
});

// GET /api/teachers — Orodha ya walimu (Admin)
app.get('/api/teachers', authMiddleware, (req, res) => {
  db.all('SELECT id, first_name, middle_name, last_name, subject, role, is_active, created_at FROM teachers', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Tatizo la seva' });
    res.json(rows);
  });
});

// POST /api/teachers — kuongeza mwalimu (Admin)
app.post('/api/teachers', authMiddleware, (req, res) => {
  const { firstName, middleName, lastName, subject, role, password } = req.body;
  if (!firstName || !middleName || !lastName || !subject || !password)
    return res.status(400).json({ error: 'Jaza sehemu zote' });

  const hash = bcrypt.hashSync(password, 10);
  db.run(
    'INSERT INTO teachers (first_name, middle_name, last_name, subject, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
    [firstName.toUpperCase(), middleName.toUpperCase(), lastName.toUpperCase(), subject, role || 'Mwalimu', hash],
    function(err) {
      if (err) return res.status(500).json({ error: 'Imeshindwa. Jina huenda lipo tayari.' });
      res.json({ ok: true, id: this.lastID, message: 'Mwalimu ameongezwa' });
    }
  );
});

// DELETE /api/teachers/:id (Admin)
app.delete('/api/teachers/:id', authMiddleware, (req, res) => {
  db.run('UPDATE teachers SET is_active = 0 WHERE id = ?', [req.params.id], err => {
    if (err) return res.status(500).json({ error: 'Tatizo la seva' });
    res.json({ ok: true, message: 'Mwalimu amefutwa' });
  });
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   MFUMO WA MAHUDHURIO - SERVER         ║
║   Shule ya Sendari                     ║
╠════════════════════════════════════════╣
║   ✅ Seva inafanya kazi!               ║
║   🌐 http://localhost:${PORT}          ║
║   📱 Teacher: /teacher-attendance.html ║
║   🔐 Admin:   /admin-dashboard.html    ║
╚════════════════════════════════════════╝
  `);
});
