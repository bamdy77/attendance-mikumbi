# 📚 MWONGOZO KAMILI WA MFUMO WA MAHUDHURIO
## Shule ya Sendari — Toleo 1.0

---

## 📁 MUUNDO WA FAILI

```
mahudhurio/
├── teacher-attendance.html   ← Ukurasa wa walimu (simu)
├── admin-dashboard.html      ← Dashboard ya mkuu wa shule
├── server.js                 ← Backend (Node.js)
├── package.json              ← Dependencies
├── manifest.json             ← PWA (kuinstall simu)
├── sw.js                     ← Service Worker (offline)
├── favicon.ico               ← Ikoni ya browser (weka yako)
├── govt-logo.png             ← Logo ya serikali (weka yako)
├── school-logo.png           ← Logo ya shule (weka yako)
└── mahudhurio.db             ← Database (inaundwa otomatiki)
```

---

## ⚙️ HATUA 1: WEKA MIPANGILIO YAKO

### A. Latitude na Longitude ya Shule Yako
1. Fungua Google Maps kwenye simu au kompyuta
2. Bonyeza kidole kwenye jengo la shule yako hadi utakapopata alama
3. Utaona nambari kama: `-2.516667, 32.900000`
4. Nambari ya kwanza = LATITUDE, ya pili = LONGITUDE

Weka nambari hizi katika:
- **server.js** — mistari: `SCHOOL_LAT` na `SCHOOL_LNG`
- **teacher-attendance.html** — mistari: `SCHOOL_LAT` na `SCHOOL_LNG`

### B. MAC Address ya WiFi Router ya Shule
MAC address inaonekana kwenye:
- Stika ya nyuma ya router (imeandikwa "MAC" au "BSSID")
- Au: fungua kompyuta, unganisha WiFi ya shule, andika `arp -a` kwenye CMD

Mfano wa MAC: `AA:BB:CC:DD:EE:FF`

Weka MAC katika:
- **server.js** — mstari: `SCHOOL_WIFI_MAC`
- **teacher-attendance.html** — mstari: `SCHOOL_WIFI_MAC`

### C. Jina la WiFi (SSID)
Jina linaloonekana walimu wanapounganisha WiFi.
- **server.js** — mstari: `SCHOOL_WIFI_SSID`
- **teacher-attendance.html** — mstari: `SCHOOL_WIFI_SSID`

### D. Subnet ya Network ya Shule
Hii inakusaidia kuangalia IP ya mtumizi.
Mfano: Kama router IP ni `192.168.1.1`, subnet ni `192.168.1`
- **server.js** — mstari: `SCHOOL_SUBNET`

### E. Weka Logo Zako
- `govt-logo.png` — Piga picha au scan logo ya serikali, weka kwenye folda
- `school-logo.png` — Logo ya shule yako
- `favicon.ico` — Ikoni ndogo (unaweza kutumia tool ya bure: favicon.io)

---

## 🖥️ HATUA 2: KUANZISHA SERVER

### Option A: Kompyuta ya Shule (Intranet - Bila Internet)
Hii ni bora zaidi kwa usalama. Walimu wanaungana kupitia WiFi ya shule tu.

**1. Sakinisha Node.js**
- Nenda: https://nodejs.org
- Pakua toleo la LTS (Long Term Support)
- Sakinisha kwa kawaida

**2. Sakinisha dependencies**
```bash
# Fungua Command Prompt / Terminal ndani ya folda ya mradi
cd mahudhurio
npm install
```

**3. Anzisha server**
```bash
node server.js
```

**4. Ukurasa wa walimu**
- Kwenye simu: `http://192.168.1.X:3000/teacher-attendance.html`
  (Badilisha X na IP ya kompyuta inayoendesha server)

**5. Admin dashboard**
- `http://192.168.1.X:3000/admin-dashboard.html`

---

### Option B: VPS Online (Walimu wa Mbali pia)

**Platforms zinazopendekeza:**
| Platform | Bei | Rahisi |
|----------|-----|--------|
| Railway.app | Bure (hobby) / $5/mwezi | ⭐⭐⭐⭐⭐ |
| Render.com | Bure (inaweza kulala) / $7/mwezi | ⭐⭐⭐⭐ |
| DigitalOcean Droplet | $6/mwezi | ⭐⭐⭐ |
| Heroku | $5/mwezi | ⭐⭐⭐ |

**Hatua za Railway.app (Rahisi zaidi):**
1. Nenda: https://railway.app
2. Jiandikishe na GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Push code yako GitHub
5. Railway itasanikisha otomatiki
6. Utapata URL kama: `https://mahudhurio-school.up.railway.app`

---

## 📱 HATUA 3: KUINSTALL APP KWENYE SIMU (PWA)

### Android (Chrome Browser):
1. Fungua Chrome kwenye simu
2. Nenda: `http://192.168.1.X:3000/teacher-attendance.html`
3. Bonyeza menu (⋮) juu kulia
4. Chagua "Add to Home screen" au "Install app"
5. App itaonekana kama programu ya kawaida!

### iOS (iPhone/iPad Safari):
1. Fungua Safari
2. Nenda kwenye URL ya mfumo
3. Bonyeza ikoni ya kushiriki (Share) chini
4. Chagua "Add to Home Screen"
5. Bonyeza "Add"

**Baada ya kuinstall:**
- App inafunguka bila browser bar
- Inafanya kazi hata kama signal ya internet ni dhaifu
- Inaonekana kama programu ya kawaida kwenye simu

---

## 🔒 HATUA 4: MIPANGILIO YA USALAMA

### Badilisha Passwords za Msingi:
1. **Admin password**: Katika `server.js`, mstari wa `adminHash`, badilisha `admin123`
2. **JWT Secret**: Badilisha `JWT_SECRET` kuwa neno refu la nasibu
3. **Passwords za walimu**: Kwenye admin dashboard → Walimu → badilisha kila mmoja

### Weka HTTPS (Lazima kwa GPS kwenye production):
GPS kwenye browsers inahitaji HTTPS (isipokuwa `localhost`).
- Railway na Render hutoa HTTPS bure otomatiki ✅
- Kwa server ya ndani: tumia Nginx na Let's Encrypt au self-signed certificate

---

## 👨‍💻 HATUA 5: KUONGEZA WALIMU

### Njia 1: Admin Dashboard (Rahisi)
1. Fungua `/admin-dashboard.html`
2. Login: username=`admin`, password=`admin123`
3. Tab ya "Walimu" → Jaza fomu → "Ongeza Mwalimu"

### Njia 2: API (kwa wingi)
```bash
curl -X POST http://localhost:3000/api/teachers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"JINA","middleName":"KATI","lastName":"UKOO","subject":"Somo","password":"1234"}'
```

---

## ❓ MASWALI NA MAJIBU

### Q: Je, system itaendelea kufanya kazi bila internet?
**A: NDIYO** — Kama imewekwa kwenye kompyuta ya shule (Intranet):
- Haitegemei internet yoyote
- Inafanya kazi 24/7 kwa sababu kompyuta ya shule inaendesha server
- Haitasumbua kwa matatizo ya internet ya nje

### Q: Je, itakataa baada ya muda fulani?
**A: Inategemea uchaguzi wako:**
- **Kompyuta ya ndani**: Haitakataa kamwe mradi kompyuta iko on
- **Railway bure**: Inaweza "kulala" baada ya kutotumika (dakika 30), lakini inaamka tena mara mtumiaji anapofungua
- **Railway $5/mwezi**: Haiwahi kulala, inafanya kazi 24/7
- **VPS yako (DigitalOcean/Hetzner)**: Inafanya kazi 24/7, wewe ndiye bosi

### Q: Data itasalimika vipi?
- SQLite database (`mahudhurio.db`) inahifadhi data yote kwenye kompyuta
- Fanya nakala (backup) ya faili hili kila wiki kwenye USB au Google Drive
- Kwa VPS, weka cron job ya backup otomatiki

---

## 🏠 TATIZO LA NYUMBA ZA WALIMU (MUHIMU)

Kama ulivyouliza — walimu wanaweza kusajili wakiwa nyumbani kwenye mita 50.

### Suluhisho 1: Beacon / QR Code ya Ofisi (Bora)
- Weka **QR Code** mahali maalum ndani ya jengo la shule (ofisi ya mkuu)
- Mwalimu **lazima** aitumie QR Code hiyo kwanza kabla ya kusajili
- Bila QR Code scan, mfumo hauruhusu mahudhurio
- **Hii inazuia kabisa** kusajili nyumbani!
- 📍 Nitaweza kukuunda kipengele hiki ukitaka

### Suluhisho 2: Network Segmentation (IT)
- Weka router tofauti ndani ya jengo la shule (sio nyumba za walimu)
- Walimu waweze kuunganisha tu kwenye WiFi hiyo ya ndani
- Nyumba zao zitakuwa na WiFi tofauti
- Mfumo ukague SSID na MAC ya router ya ofisi tu

### Suluhisho 3: Fingerprint / Face ID (Advanced)
- Weka kifaa cha biometrics kwenye mlango wa shule
- Kiungane na mfumo huu (API integration)
- Hii ni ufumbuzi imara zaidi lakini inahitaji gharama zaidi

### Suluhisho 4: Muda wa Kuanza + GPS Combined
- Weka GPS radius kuwa mita 20 badala ya 50 (kwa usahihi zaidi)
- Angalia Google Maps eneo halisi la majengo ya nyumba vs jengo la shule
- Kama nyumba ni mita 30, weka radius 25 — hii inazuia kusajili nyumbani

---

## 📊 VIPENGELE VYA ADMIN — UNAWEZA KUONGEZA

Ulichouliza kuongeza nini kwa upande wa admin:

| Kipengele | Maelezo |
|-----------|---------|
| **Ripoti ya Wiki** | Mfumo tayari una export ya wiki nzima |
| **Takwimu za mwezi** | Jedwali linaloonyesha idadi ya siku kila mwalimu alifika |
| **Grafu za mahudhurio** | Chart ya mstari/bar kuonyesha trend |
| **Arifa za SMS/WhatsApp** | Tuma ujumbe mkuu wa shule mwalimu akichelewa |
| **Ripoti ya mwisho wa mwezi** | Auto-generate PDF ya mahudhurio yote |
| **Hali ya mwalimu kwa siku** | Calendar view — kijani=alifika, nyekundu=hakuja |
| **Kumbukumbu za excuses** | Mwalimu akiomba ruhusa, admini aweze kuirekodi |
| **Takwimu za wakati** | Mwalimu anayefika mapema/kuchelewa zaidi |

---

## 📞 MUHTASARI WA HARAKA

```
Credentials za awali:
  Admin: admin / admin123
  
Walimu wa demo (password: 1234):
  JOHN PETER MWANGI
  MARY JOSEPH NJERI
  DAVID PAUL OUMA
  GRACE ANN WAMBUA
  PETER JAMES KAMAU

URLs:
  Walimu:  http://localhost:3000/teacher-attendance.html
  Admin:   http://localhost:3000/admin-dashboard.html
  API:     http://localhost:3000/api/...
```

---

*Mfumo huu umeundwa kwa Shule ya Sendari. Haki zote zimehifadhiwa.*
