# 🧠 NeuroHaven — Doctor Dashboard & Clinical Backend

**Author:** Naqi Haider ([@Naqi-Haider](https://github.com/Naqi-Haider))  
**Module Showcase:** Final Year Project (FYP) — Doctor Dashboard & Clinical Telemetry Subsystem

---

## 📌 Overview

**NeuroHaven** is a digital health & cognitive monitoring platform designed to support dementia and neurodegenerative patient care. 

This repository showcases the **Doctor Workstation & Clinical API Backend** module developed by Naqi Haider. It provides healthcare professionals with real-time situation awareness, patient cognitive trajectory charts, automated clinical alerts, session logs, and direct communication features.

---

## 🛠 Tech Stack

### 💻 Frontend (`neurohaven-doctor-dashboard`)
- **Framework:** Next.js 14 (App Router, React 18, TypeScript)
- **Styling:** Tailwind CSS, Lucide Icons, Shadcn UI / Radix UI primitives
- **Data Visualization:** Recharts (cognitive trends & session time charts)
- **State & Query:** Zustand, TanStack React Query, Axios
- **Real-Time Presence:** Socket.IO Client
- **Document Export:** `@react-pdf/renderer`

### ⚙️ Backend (`neurohaven-backend`)
- **Runtime:** Node.js, Express.js
- **Real-Time Infrastructure:** Socket.IO WebSocket Server
- **Database & Auth Integration:** Supabase (`@supabase/supabase-js`)
- **Push Notification Integration:** Firebase Admin SDK (`firebase-admin`)
- **Middleware:** CORS, Morgan, Multer

---

## 🚀 Built-in Standalone Mock Developer Mode

To allow instant evaluation and visual showcase without requiring external database instances, cloud keys, or reverse proxies:
- **Backend Mock Mode:** Automatically falls back to in-memory mock data for patient cohorts, cognitive telemetry, clinical alerts, and reports whenever `SUPABASE_URL` is omitted.
- **Frontend Offline Mode:** Includes realistic patient records (e.g. *Arthur Pendelton*, *Eleanor Vance*, *Gordon Cole*, *Marianne Faith*), interactive risk level filters, cognitive status breakdown, and mock authentication with preconfigured credentials (`Dr. Sarah Jenkins`).

---

## 📂 Project Structure

```
.
├── neurohaven-backend/            # Express.js REST & Socket.IO backend
│   ├── config/                    # Supabase, Firebase, Socket.IO configs
│   ├── controllers/               # Clinical API controllers with Mock fallbacks
│   ├── routes/                    # API endpoints (/patients, /overview, /reports, etc.)
│   ├── server.js                  # Entry point
│   ├── .env.example               # Template environment variables
│   └── service-account.json.example # Firebase service account template
│
├── neurohaven-doctor-dashboard/   # Next.js 14 Doctor Workstation
│   ├── src/
│   │   ├── app/                   # App Router pages ((auth), (dashboard), etc.)
│   │   ├── components/            # Clinical UI components, charts, and dialogs
│   │   ├── hooks/                 # Authentication & WebSocket custom hooks
│   │   └── lib/                   # Supabase & Axios instances
│   └── .env.example               # Template environment variables
│
└── README.md                      # Documentation
```

---

## ⚡ Quick Start (Local Setup)

### Prerequisites
- **Node.js:** v18.x or higher (v22 recommended)
- **npm:** v9.x or higher

### 1️⃣ Run the Backend Server

```bash
cd neurohaven-backend
npm install
npm start
```
The Express & Socket.IO backend will run on `http://localhost:3001`.

### 2️⃣ Run the Doctor Dashboard

In a new terminal window:

```bash
cd neurohaven-doctor-dashboard
npm install
npm run dev
```
The Next.js workstation will open on `http://localhost:3000`.

---

## ☁️ Deployment (Visual Showcase)

### Deploy Frontend to Vercel (Recommended)
1. Import `neurohaven-doctor-dashboard` into your [Vercel](https://vercel.com) account.
2. Framework Preset: **Next.js**.
3. Click **Deploy**. The app will build statically and run in standalone Mock Mode out-of-the-box!

### Deploy Backend to Render / Railway
1. Create a Web Service on [Render](https://render.com) or [Railway](https://railway.app).
2. Set Root Directory to `neurohaven-backend`.
3. Build Command: `npm install`
4. Start Command: `npm start`

---

## 🔒 Security & Environmental Configurations

Sensitive keys (e.g. Firebase `service-account.json` and production `.env` files) are explicitly excluded via `.gitignore`. 

For connecting live production services, copy the template files:
```bash
cp neurohaven-backend/.env.example neurohaven-backend/.env
cp neurohaven-doctor-dashboard/.env.example neurohaven-doctor-dashboard/.env.local
```

---

## 📜 License

Created for Final Year Project (FYP) demonstration. All rights reserved by Naqi Haider.
