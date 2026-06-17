/**
 * ============================================================
 * BACKEND SERVER - TAMS
 * Mikumbi Secondary School - Newala
 * ============================================================
 */

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { Pool } = require('pg');

const app        = express();
const PORT       = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'tams-mikumbi-2025-secret';

// ============================================================
// CONFIGURATION
// ============================================================
const CONFIG = {
  SCHOOL_LAT:    -10.561915,
  SCHOOL_LNG:     39.178560,
  SCHOOL_RADIUS_M: 45,
  DEADLINE_HOUR:  7,
  DEADLINE_MIN:  30,
};

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({
  origin: [
    'https://attendance-mikumbi-production.up.railway.app',
    'http://localhost:8080',
  ],
  methods: ['GET','POST','DELETE'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'files')));

// ============================================================
// POSTGRESQL DATABASE
// ============================================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  const client = await pool.connect();
  try {
    // Teachers table — with UNIQUE constraint on names
    await client.query(`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        first_name TEXT NOT NULL,
        middle_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        role TEXT DEFAULT 'Mwalimu',
        password_hash TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(first_name, middle_name, last_name)
      )
    `);

    // Add UNIQUE constraint on existing databases that don't have it yet
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'teachers_first_name_middle_name_last_name_key'
        ) THEN
          -- First remove duplicates keeping lowest id not referenced by attendance
          DELETE FROM teachers t1
          USING teachers t2
          WHERE t1.first_name = t2.first_name
            AND t1.middle_name = t2.middle_name
            AND t1.last_name = t2.last_name
            AND t1.id > t2.id;

          ALTER TABLE teachers
            ADD CONSTRAINT teachers_first_name_middle_name_last_name_key
            UNIQUE (first_name, middle_name, last_name);
        END IF;
      END$$;
    `);

    // Attendance table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL,
        teacher_name TEXT NOT NULL,
        subject TEXT,
        date TEXT NOT NULL,
        time_str TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW(),
        is_late INTEGER DEFAULT 0,
        latitude REAL,
        longitude REAL,
        distance_m INTEGER,
        ip_address TEXT,
        device_fingerprint TEXT,
        UNIQUE(teacher_id, date),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
      )
    `);

    // Add device_fingerprint column if it doesn't exist (existing databases)
    await client.query(`
      ALTER TABLE attendance ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;
    `);

    // Device registrations table — one device per day
    await client.query(`
      CREATE TABLE IF NOT EXISTS device_registrations (
        id SERIAL PRIMARY KEY,
        device_fingerprint TEXT NOT NULL,
        teacher_id INTEGER NOT NULL,
        teacher_name TEXT NOT NULL,
        date TEXT NOT NULL,
        registered_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(device_fingerprint, date),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
      )
    `);

    // Admins table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Seed admin
    const adminHash = bcrypt.hashSync('admin123', 10);
    await client.query(`
      INSERT INTO admins (username, password_hash, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', adminHash, 'Mkuu wa Shule']);

    // Seed teachers — safe: ON CONFLICT on name does nothing
    const teachers = [
      ['DEOGRATIUS', 'ROBERT',   'MUZO',    'History',    'Mhasibu'],
      ['OCTAVIAN',   'CONRAD',   'MILLANZI','Geography',  'Mkuu wa Shule'],
      ['TEOFRID',    'TIMOTEO',  'KWENGA',  'Economics',  'Mwalimu'],
      ['LINUS',      'SAMORA',   'MADAMA',  'Mathematics','Mtaalamu Msaidizi'],
      ['ENOCK',      'SOSPETER', 'MATHAYO', 'Physics',    'Mwalimu wa Nidhamu'],
      ['IGNATIO',    'BEYANGA',  'EZEKIEL', 'Biology',    'Makamu wa Shule'],
      ['CHRISTOM',   'KASIAN',   'KOMBA',   'English',    'Mtaalamu Mwandamizi'],
      ['FELISTA',    'DONALD',   'MOHAMED', 'Chemistry',  'Mwalimu wa Afya'],
      ['AHMAD',      'MOHAMED',  'VINDILI', 'Chemistry',  'Mwalimu wa Michezo'],
    ];

    for (const [fn, mn, ln, sub, role] of teachers) {
      const hash = bcrypt.hashSync('1234', 10);
      await client.query(`
        INSERT INTO teachers (first_name, middle_name, last_name, subject, role, password_hash)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (first_name, middle_name, last_name) DO NOTHING
      `, [fn, mn, ln, sub, role, hash]);
    }

    console.log('✅ PostgreSQL Database imeunganishwa na kuandaliwa');
  } finally {
    client.release();
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// Tanzania is UTC+3. We get the true local time by using toLocaleString.
function getTanzaniaTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Dar_es_Salaam' }));
}

function isLate() {
  const now = getTanzaniaTime();
  const deadline = new Date(now);
  deadline.setHours(CONFIG.DEADLINE_HOUR, CONFIG.DEADLINE_MIN, 0, 0);
  return now > deadline;
}

function isWithinWindow() {
  const now   = getTanzaniaTime();
  const start = new Date(now); start.setHours(6, 0, 0, 0);
  const close = new Date(now); close.setHours(8, 0, 0, 0);
  return now >= start && now < close;
}

function getTodayDate() {
  const now = getTanzaniaTime();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  const d   = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}`;
}

function formatDate(date) {
  const days   = ['Jumapili','Jumatatu','Jumanne','Jumatano','Alhamisi','Ijumaa','Jumamosi'];
  const months = ['Januari','Februari','Machi','Aprili','Mei','Juni','Julai','Agosti','Septemba','Oktoba','Novemba','Desemba'];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

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

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Jaza sehemu zote' });
  try {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin  = result.rows[0];
    if (!admin || !bcrypt.compareSync(password, admin.password_hash))
      return res.status(401).json({ error: 'Jina au neno la siri si sahihi' });
    const token = jwt.sign({ id: admin.id, username: admin.username, name: admin.name }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, name: admin.name });
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/attendance — Weka Mahudhurio
app.post('/api/attendance', async (req, res) => {
  const { firstName, middleName, lastName, password, lat, lng, deviceFingerprint } = req.body;

  if (!firstName || !middleName || !lastName || !password)
    return res.status(400).json({ ok: false, error: 'Jaza sehemu zote' });

  if (!lat || !lng)
    return res.status(400).json({ ok: false, error: 'GPS is required. Please enable GPS and try again.' });

  // Time window check
  if (!isWithinWindow()) {
    const now   = getTanzaniaTime();
    const start = new Date(now); start.setHours(6, 0, 0, 0);
    if (now < start)
      return res.status(403).json({ ok: false, error: 'Registration not yet open. Opens at 6:00 AM.' });
    else
      return res.status(403).json({ ok: false, error: 'Registration closed. Attendance closed at 8:00 AM.' });
  }

  // Distance check
  const distance = haversineDistance(lat, lng, CONFIG.SCHOOL_LAT, CONFIG.SCHOOL_LNG);
  if (distance > CONFIG.SCHOOL_RADIUS_M)
    return res.status(403).json({ ok: false, error: `You are ${Math.round(distance)}m from school. Must be within ${CONFIG.SCHOOL_RADIUS_M}m.` });

  const fn = firstName.toUpperCase().trim();
  const mn = middleName.toUpperCase().trim();
  const ln = lastName.toUpperCase().trim();

  try {
    // Find teacher
    const tResult = await pool.query(
      'SELECT * FROM teachers WHERE first_name=$1 AND middle_name=$2 AND last_name=$3 AND is_active=1',
      [fn, mn, ln]
    );
    const teacher = tResult.rows[0];
    if (!teacher) return res.status(401).json({ ok: false, error: 'Jina halipatikani. Angalia tahajia na ujaribu.' });
    if (!bcrypt.compareSync(password, teacher.password_hash))
      return res.status(401).json({ ok: false, error: 'Neno la siri si sahihi.' });

    const today       = getTodayDate();
    const now         = getTanzaniaTime();
    const late        = isLate();
    const timeStr     = formatTime(now);
    const dateStr     = formatDate(now);
    const teacherName = `${fn} ${mn} ${ln}`;
    const clientIP    = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    // ── DEVICE CHECK — device moja, mwalimu mmoja kwa siku ──
    if (deviceFingerprint) {
      const devCheck = await pool.query(
        'SELECT teacher_id, teacher_name FROM device_registrations WHERE device_fingerprint=$1 AND date=$2',
        [deviceFingerprint, today]
      );
      if (devCheck.rows[0] && devCheck.rows[0].teacher_id !== teacher.id) {
        return res.status(409).json({
          ok: false,
          error: `Kifaa hiki kilitumika leo kusajili ${devCheck.rows[0].teacher_name}. Kifaa kimoja kinaruhusu mwalimu mmoja tu kwa siku.`
        });
      }
    }

    // Check duplicate attendance
    const dupCheck = await pool.query(
      'SELECT id, time_str FROM attendance WHERE teacher_id=$1 AND date=$2',
      [teacher.id, today]
    );
    if (dupCheck.rows[0])
      return res.status(409).json({ ok: false, error: `Tayari umesajili leo saa ${dupCheck.rows[0].time_str}` });

    // Save attendance
    await pool.query(
      `INSERT INTO attendance (teacher_id, teacher_name, subject, date, time_str, is_late, latitude, longitude, distance_m, ip_address, device_fingerprint)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [teacher.id, teacherName, teacher.subject, today, timeStr, late?1:0, lat, lng, Math.round(distance), clientIP, deviceFingerprint || null]
    );

    // Save device registration
    if (deviceFingerprint) {
      await pool.query(`
        INSERT INTO device_registrations (device_fingerprint, teacher_id, teacher_name, date)
        VALUES ($1,$2,$3,$4)
        ON CONFLICT (device_fingerprint, date) DO NOTHING
      `, [deviceFingerprint, teacher.id, teacherName, today]);
    }

    res.json({ ok: true, isLate: late, teacherName, subject: teacher.subject, timeStr, dateStr, distanceM: Math.round(distance) });

  } catch(e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Server error. Try again.' });
  }
});

// POST /api/admin/change-password
app.post('/api/admin/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Fill in all fields' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
  try {
    const result = await pool.query('SELECT * FROM admins WHERE id=$1', [req.user.id]);
    const admin  = result.rows[0];
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    if (!bcrypt.compareSync(currentPassword, admin.password_hash))
      return res.status(401).json({ error: 'Current password is incorrect' });
    const newHash = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE admins SET password_hash=$1 WHERE id=$2', [newHash, admin.id]);
    res.json({ ok: true, message: 'Password changed successfully' });
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/attendance/today
app.get('/api/attendance/today', authMiddleware, async (req, res) => {
  const today = getTodayDate();
  try {
    const [records, teachers] = await Promise.all([
      pool.query('SELECT * FROM attendance WHERE date=$1 ORDER BY timestamp ASC', [today]),
      pool.query('SELECT * FROM teachers WHERE is_active=1 ORDER BY id')
    ]);

    const presentIds = new Set(records.rows.map(r => r.teacher_id));
    const result = teachers.rows.map(t => {
      const rec = records.rows.find(r => r.teacher_id === t.id);
      return {
        teacherId:   t.id,
        teacherName: `${t.first_name} ${t.middle_name} ${t.last_name}`,
        subject:     t.subject,
        role:        t.role,
        present:     !!rec,
        isLate:      rec ? !!rec.is_late : null,
        timeStr:     rec ? rec.time_str : null,
        distanceM:   rec ? rec.distance_m : null,
      };
    });

    res.json({
      date:     today,
      total:    teachers.rows.length,
      present:  presentIds.size,
      absent:   teachers.rows.length - presentIds.size,
      late:     records.rows.filter(r => r.is_late).length,
      teachers: result
    });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/attendance/range
app.get('/api/attendance/range', authMiddleware, async (req, res) => {
  const { from, to, teacher_id } = req.query;
  const fromDate = from || getTodayDate();
  const toDate   = to   || getTodayDate();
  try {
    let query  = 'SELECT * FROM attendance WHERE date>=$1 AND date<=$2';
    let params = [fromDate, toDate];
    if (teacher_id) { query += ' AND teacher_id=$3'; params.push(teacher_id); }
    query += ' ORDER BY date DESC, timestamp ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/teachers
app.get('/api/teachers', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, middle_name, last_name, subject, role, is_active, created_at FROM teachers WHERE is_active=1 ORDER BY id'
    );
    res.json(result.rows);
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/teachers
app.post('/api/teachers', authMiddleware, async (req, res) => {
  const { firstName, middleName, lastName, subject, role, password } = req.body;
  if (!firstName || !middleName || !lastName || !subject || !password)
    return res.status(400).json({ error: 'Jaza sehemu zote' });
  try {
    const hash   = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO teachers (first_name, middle_name, last_name, subject, role, password_hash) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [firstName.toUpperCase(), middleName.toUpperCase(), lastName.toUpperCase(), subject, role||'Mwalimu', hash]
    );
    res.json({ ok: true, id: result.rows[0].id, message: 'Mwalimu ameongezwa' });
  } catch(e) {
    if (e.code === '23505') // unique violation
      return res.status(409).json({ error: 'Mwalimu huyu yuko tayari kwenye mfumo.' });
    res.status(500).json({ error: 'Imeshindwa. Jaribu tena.' });
  }
});

// DELETE /api/teachers/:id
app.delete('/api/teachers/:id', authMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'ID si sahihi' });
  try {
    const check = await pool.query('SELECT id FROM teachers WHERE id=$1', [id]);
    if (!check.rows[0]) return res.status(404).json({ error: 'Mwalimu hapatikani' });
    await pool.query('UPDATE teachers SET is_active=0 WHERE id=$1', [id]);
    res.json({ ok: true, message: 'Mwalimu amefutwa' });
  } catch(e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// START SERVER
// ============================================================
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   TAMS SERVER - PostgreSQL               ║
║   Mikumbi Secondary School - Newala      ║
╠══════════════════════════════════════════╣
║   ✅ Seva inafanya kazi!                 ║
║   🌐 http://localhost:${PORT}               ║
║   📱 Teacher: /teacher-attendance.html   ║
║   🔐 Admin:   /admin-dashboard.html      ║
╚══════════════════════════════════════════╝
    `);
  });
}).catch(err => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});
