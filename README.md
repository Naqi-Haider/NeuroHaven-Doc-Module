# NeuroHaven - Doctor Workstation and Clinical Management Module

Author: Naqi Haider (GitHub: Naqi-Haider)
Project Type: Final Year Project (FYP) Showcase Module
Role: Management, Telemetry Analytics, and Clinical Monitoring System

---

## Overview

NeuroHaven is a digital health platform designed for cognitive monitoring and rehabilitation support in neurodegenerative patient care. This repository contains the Doctor Workstation frontend and Clinical Backend API subsystem.

The module serves as a clinical monitoring center where healthcare providers can observe patient cognitive trajectories, manage active care pathways, track session adherence, receive automated clinical alerts, communicate with patients, export clinical evaluation reports, and manage platform administration.

---

## Architecture and Technology Stack

### Frontend Subsystem (neurohaven-doctor-dashboard)
* Framework: Next.js 14 (App Router, React 18, TypeScript)
* Styling and UI: Tailwind CSS, Lucide Icons, Radix UI primitives, Shadcn UI
* Data Visualization: Recharts (longitudinal trend curves, activity time distributions, score breakdowns)
* State Management: Zustand, TanStack React Query, Axios
* Real-Time Infrastructure: Socket.IO Client for presence and live updates
* Document Generation: @react-pdf/renderer for PDF report generation

### Backend Subsystem (neurohaven-backend)
* Runtime Environment: Node.js, Express.js
* Real-Time Server: Socket.IO WebSocket server
* Database Integration: Supabase JavaScript SDK (@supabase/supabase-js)
* Push Notification Gateway: Firebase Admin SDK (firebase-admin)
* Middleware: CORS handling, Morgan logging, Multer file processing

---

## Key Modules and Functional Subsystems

### 1. Doctor Workstation Overview
* Situation Awareness Strip: Summary bar providing metrics on unresolved critical alerts, adherence declines, active companion chat sessions, and doctor license verification status.
* Active Care Pathways Ledger: Comprehensive patient list displaying risk levels, cognitive scores, score trend deltas, 7-day activity grids, and direct navigation actions.
* Quick Triage Controls: Filtering options to isolate connected cohorts by status (All Connected, Needs Review, Improving).
* Zero State Management: Built-in toggle to demonstrate workstation views with or without active connected patients.

### 2. Cognitive Telemetry and Data Analytics
* Cognitive Scoring Index: Unified 0-100 scale derived from patient game performance across five game categories (Memory Match, Word Recall, Pattern Recognition, Abstract Reasoning, Sequence Recall).
* 7-Day Activity Grid: Daily compliance visualizer displaying completed session scores or missed session indicators for Monday through Sunday.
* Longitudinal Cognitive Trends: 30-day interactive line chart comparing individual patient curves against the cohort average.
* Session History Logging: Detailed breakdown of individual game sessions including game type, difficulty level, score achieved, duration, and user mood rating.
* Speech and AI Sentiment Analysis: Textual and acoustic sentiment tracking logging emotional index, lexical density, speech speed, and clinical summaries.

### 3. Clinical Alerts and Notification Gateway
* Severity Categorization: Alerts classified into Critical, Warning, and Info severity tiers.
* Alert Categories: Medical (missed dosages), Cognitive (rapid score drops), Emotional (low mood sentiment), and Omission (missed daily exercises).
* Triage and Resolution: Ability for doctors to review, filter, mark read, or resolve active alerts.
* Mobile Push Gateway: Backend support for sending FCM push notifications to patient mobile devices for urgent alerts, call invitations, and new messages.

### 4. Patient-Doctor Connections and Real-Time Presence
* Clinical Connection Linking: Secure linking protocol allowing doctors to connect with patients using unique connection codes.
* Real-Time Presence Tracking: Socket.IO WebSocket connection tracking online status, active session status, and last seen timestamps.

### 5. Patient-Doctor Communication
* Direct Messaging: Real-time chat interface between doctor and patient with support for text messages, voice message audio telemetry, and image attachments.
* Incoming/Outgoing Call Support: Push triggers and WebSocket signaling for clinical video and audio calls.

### 6. Clinical Reports and PDF Export
* Patient Evaluation Summaries: Auto-generated cognitive and behavioral digests based on telemetry history.
* PDF Document Export: In-browser generation of printable clinical reports containing patient background, performance metrics, risk assessments, and recommendations.

### 7. Administrative Management System (Admin Subsystem)
* Admin Dashboard: High-level overview of platform doctors, patients, total system connections, and server logs.
* Doctor Account Management: Interface to inspect doctor profiles, verify medical licenses, and update registration statuses.
* Patient Directory Management: Administrative view of all registered patient profiles and caregiver contacts.
* System Support Tickets: Administrative ticketing portal for managing platform inquiries and technical support requests.

### 8. Standalone Mock Developer Mode
* Built-in Mock Server: Express backend automatically operates in Mock Developer Mode when cloud credentials are not supplied, serving realistic patient records, session histories, and alerts.
* Offline Presentation Support: Next.js frontend includes preconfigured fallback data for offline visual demonstrations and static deployments (such as Vercel).

---

## Directory Structure

```
.
├── neurohaven-backend/            # Express.js API and Socket.IO server
│   ├── config/                    # Supabase, Firebase, and Socket.IO configurations
│   ├── controllers/               # API business logic with Mock fallbacks
│   ├── routes/                    # Express route definitions
│   ├── server.js                  # Main server entry point
│   ├── .env.example               # Backend environment variables template
│   └── service-account.json.example # Firebase service account key template
│
├── neurohaven-doctor-dashboard/   # Next.js Doctor Workstation application
│   ├── src/
│   │   ├── app/                   # Next.js App Router pages
│   │   ├── components/            # UI components, cards, tables, and charts
│   │   ├── hooks/                 # Custom React hooks for auth and WebSockets
│   │   └── lib/                   # API clients and utilities
│   └── .env.example               # Frontend environment variables template
│
└── README.md                      # Documentation file
```

---

## Local Development Setup

### Prerequisites
* Node.js v18.x or higher (v22 recommended)
* npm v9.x or higher

### Step 1: Start the Backend API Server
```bash
cd neurohaven-backend
npm install
npm start
```
The backend server runs at http://localhost:3001.

### Step 2: Start the Doctor Workstation Frontend
In a separate terminal window:
```bash
cd neurohaven-doctor-dashboard
npm install
npm run dev
```
The frontend application runs at http://localhost:3000.

---

## Deployment Guidelines

### Frontend Deployment (Vercel)
1. Import the neurohaven-doctor-dashboard directory into Vercel.
2. Framework Preset: Next.js.
3. Deploy directly without requiring environment variables to run in Standalone Showcase Mode.

### Backend Deployment (Render or Railway)
1. Create a Web Service pointing to neurohaven-backend.
2. Build Command: npm install
3. Start Command: npm start

---

## License and Attribution

Developed by Naqi Haider as part of the Final Year Project (FYP). All rights reserved.
