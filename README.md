# Teachers Attendance Management System (TAMS)

**Mikumbi Secondary School — Newala, Tanzania**

TAMS is a GPS-verified digital attendance platform built for Mikumbi Secondary School. It replaces paper-based registers with a real-time, location-aware system that works on any smartphone without requiring an app download.

The system has two sides: a teacher-facing portal where staff mark their daily attendance, and an admin dashboard where the Head of School monitors attendance, manages staff, and exports reports.

---

## How It Works

A teacher opens the system on their phone each morning within the registration window (6:00 AM to 8:00 AM). The system verifies their GPS location — they must be within 45 metres of the school. If they are inside the allowed zone and within the time window, they enter their full name and password to sign in. The system records the exact time and marks them as on time or late depending on whether they signed in before 7:30 AM.

If a teacher arrives after 7:30 AM, they are required to provide a reason for being late before the submission is accepted.

The Head of School logs into the admin dashboard from any device. The dashboard shows who is present, who is absent, and who arrived late — updated in real time. The admin can filter attendance by date range, export reports as PDF or Excel, add and remove teachers, and reset teacher passwords.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL (via Railway) |
| Authentication | JWT (8-hour expiry), bcryptjs |
| Deployment | Railway.app |
| Mobile | Progressive Web App (PWA) |

---

## Features

**Teacher Portal**

- GPS verification using the Haversine formula — server-side distance calculation
- Time window enforcement using Tanzania timezone (Africa/Dar_es_Salaam) regardless of device timezone
- Late reason submission required for arrivals after 7:30 AM
- Device fingerprinting to prevent duplicate submissions on the same day
- Attendance history showing the last 5 sign-ins
- Installable as a PWA on Android and iOS

**Admin Dashboard**

- Live attendance overview with present, absent, and late counts
- Full attendance history with filters by date range, teacher, and status
- Monthly summary with attendance percentage per teacher
- Export to PDF and Excel (CSV) with CSV injection protection
- Add and remove teachers
- Reset any teacher's password
- Automatic session expiry with redirect to login after 8 hours
- Rate limiting on login and attendance endpoints

---

## Security

- Passwords hashed with bcryptjs (10 salt rounds)
- JWT tokens expire after 8 hours
- Rate limiting: 10 login attempts per 15 minutes per IP, 5 attendance submissions per minute per IP
- GPS coordinates verified server-side — the frontend cannot bypass the distance check
- All API responses involving user data require a valid JWT token
- XSS protection on all innerHTML rendering through an escape function
- CSV injection protection on all exported data

---

## Installation

**Requirements:** Node.js v18 or higher, PostgreSQL database

```bash
git clone https://github.com/bamdy77/attendance-mikumbi.git
cd attendance-mikumbi
npm install
```

Set the following environment variables before starting:

```
DATABASE_URL      = your PostgreSQL connection string
JWT_SECRET        = a long random secret key
ADMIN_DEFAULT_PASSWORD = your chosen admin password
PORT              = 3000
```

Then start the server:

```bash
npm start
```

| Page | URL |
|------|-----|
| Landing Page | http://localhost:3000 |
| Teacher Portal | http://localhost:3000/teacher-attendance.html |
| Admin Dashboard | http://localhost:3000/admin-dashboard.html |

---

## Configuration

The school's GPS coordinates, allowed radius, and time window are set in `teacher-attendance.html` inside the `CONFIG` object:

```javascript
const CONFIG = {
  SCHOOL_LAT:      -10.561915,  // Latitude ya shule
  SCHOOL_LNG:       39.178560,  // Longitude ya shule
  SCHOOL_RADIUS_M:  45,         // Mita 45 kutoka shuleni
  START_HOUR:       6,          // Usajili unaanza saa 12:00 asubuhi
  START_MIN:        0,
  DEADLINE_HOUR:    7,          // Kuchelewa baada ya 7:30 asubuhi
  DEADLINE_MIN:     30,
  CLOSE_HOUR:       8,          // Usajili unafungwa 8:00 asubuhi
  CLOSE_MIN:        0,
};
```

---

## Installing as a Mobile App

**Android (Chrome)**
1. Open Chrome and navigate to the deployment URL
2. Tap the menu and select "Add to Home Screen" or "Install App"

**iOS (Safari)**
1. Open Safari and navigate to the deployment URL
2. Tap the Share button, then "Add to Home Screen"

GPS verification requires HTTPS. Railway provides HTTPS automatically on all deployments.

---

## Project Structure

```
> attendance-mikumbi/
> server.js                 # Express backend, PostgreSQL, API routes
> teacher-attendance.html   # Teacher PWA — mobile-first
> admin-dashboard.html      # Admin dashboard
> index.html                # Landing page
> sw.js                     # Service worker — offline support, network-first caching
> manifest.json             # PWA manifest
> package.json              # Dependencies
> govt-logo.svg             # Government of Tanzania logo
> school-logo.svg           # Mikumbi Secondary School logo
> app-icon.svg              # Home screen app icon
---

## Deployment

This project runs on Railway.app with a PostgreSQL database. The database schema is created automatically on first run — no manual migration is needed.

Live deployment: https://attendance-mikumbi-production.up.railway.app

To deploy your own instance:

1. Fork this repository
2. Create an account at railway.app and connect your GitHub
3. Create a new project and deploy from the forked repository
4. Add a PostgreSQL database plugin inside Railway
5. Set the environment variables listed above
6. Railway will assign a public URL automatically



## Author

Baraka A Martine — Student, Mwenge Catholic University (MWECAU), Tanzania


Built for Mikumbi Secondary School, Newala, Mtwara Region, Tanzania.
