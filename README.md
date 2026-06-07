# 🏫 Teacher Attendance Management System
### S.S. Mikumbi Secondary School — Newala, Tanzania

A modern, GPS and WiFi-verified digital attendance system for teachers, built as a Progressive Web App (PWA) installable on any Android or iOS device.

---

## 📸 Overview

This system replaces paper-based attendance registers with a secure, location-aware digital solution. Teachers mark their attendance directly from their smartphones, while the headmaster monitors everything in real time from a dedicated admin dashboard — from anywhere in the world.

---

## ✨ Key Features

### Teacher Portal
- 📍 **GPS Verification** — Teacher must be within 70 metres of the school to mark attendance
- 📶 **WiFi Verification** — Must be connected to the school's WiFi network
- ⏰ **Time Window** — Registration opens at 12:00 AM and closes at 7:30 AM
- 🟢 **ON TIME / 🔴 LATE** — Automatic status based on arrival time
- 🔐 **Password Reset** — 3-step identity verification before resetting password
- 📱 **PWA** — Installable as a native-like app on Android and iOS

### Admin Dashboard
- 📊 **Real-Time Overview** — See all teachers present, absent, and late at a glance
- 🕐 **Live Timestamps** — Exact time each teacher signed in
- 📅 **Attendance History** — Filter by date range, teacher, or status
- 📥 **Export Reports** — Download Excel (CSV) or PDF for today, week, month, or custom period
- ➕ **Manage Teachers** — Add or remove staff at any time
- 🔑 **Change Password** — Admin can update their own password from the Settings tab

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | SQLite3 |
| Auth | JWT (JSON Web Tokens), bcryptjs |
| Security | express-rate-limit |
| Deployment | Railway.app |
| Mobile | PWA (Progressive Web App) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/bamdy77/attendance-mikumbi.git
cd attendance-mikumbi

# Install dependencies
npm install

# Start the server
npm start
```

The server will run at `http://localhost:3000`

| Page | URL |
|------|-----|
| Teacher Portal | `http://localhost:3000/teacher-attendance.html` |
| Admin Dashboard | `http://localhost:3000/admin-dashboard.html` |

---

## ⚙️ Configuration

Before deploying, update the following constants in `teacher-attendance.html` and `server.js`:

```javascript
const CONFIG = {
  SCHOOL_LAT: -3.3086295,        // School latitude (from Google Maps)
  SCHOOL_LNG: 37.3333310,        // School longitude
  SCHOOL_RADIUS_M: 70,           // Allowed radius in metres
  DEADLINE_HOUR: 7,              // Late after 7:30 AM
  DEADLINE_MIN: 30,
  START_HOUR: 0,                 // Opens at 12:00 AM
  START_MIN: 0,
  SCHOOL_WIFI_SSID: 'SchoolWiFi', // School WiFi name
  SCHOOL_WIFI_MAC: 'XX:XX:XX:XX:XX:XX', // Router MAC address
};
```

### Environment Variables (for production)

Set these in your Railway/Render dashboard:

```
JWT_SECRET = your-long-random-secret-key
PORT = 3000
```

---

## 📱 Installing as a Mobile App

### Android (Chrome)
1. Open Chrome and navigate to your deployment URL
2. Tap the menu (⋮) → **"Add to Home Screen"** or **"Install App"**
3. The app appears on your home screen like a native app

### iOS (Safari)
1. Open Safari and navigate to your deployment URL
2. Tap the **Share** button → **"Add to Home Screen"**
3. Tap **"Add"**

> **Note:** GPS requires HTTPS. When deployed on Railway, HTTPS is provided automatically.

---

## 🔐 Default Credentials

> ⚠️ **Change these immediately after first login**

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Teachers | Full name (3 parts) | `1234` |

---

## 🏗️ Project Structure

```
attendance-mikumbi/
├── teacher-attendance.html   # Teacher PWA (mobile-first)
├── admin-dashboard.html      # Admin dashboard
├── server.js                 # Express backend + SQLite
├── package.json              # Project metadata & scripts
├── manifest.json             # PWA manifest
├── sw.js                     # Service worker (offline support)
├── favicon.ico               # Browser icon
├── govt-logo.png             # Government logo (header)
└── school-logo.png           # School logo (header)
```

---

## 🛡️ Security Features

- Passwords hashed with **bcryptjs** (salt rounds: 10)
- API sessions protected with **JWT tokens** (8-hour expiry)
- Rate limiting on attendance endpoint (20 requests / 15 minutes)
- GPS coordinates verified server-side using Haversine formula
- WiFi subnet verification prevents off-network submissions

---

## 🌍 Deployment

This project is deployed on **Railway.app**.

Live URL:
```
https://attendance-mikumbi-production.up.railway.app
```

To deploy your own instance:
1. Fork this repository
2. Sign up at [railway.app](https://railway.app) with GitHub
3. Create a new project → Deploy from GitHub repo
4. Add environment variables (`JWT_SECRET`, `PORT`)
5. Generate a domain under Settings → Networking

---

## 👨‍💻 Author

**Bamdy** — Student, Mwenge Catholic University (MWECAU)
Registration: T/DEG/2025/1846

---

## 📄 License

This project was built for S.S. Mikumbi Secondary School, Newala, Tanzania.
