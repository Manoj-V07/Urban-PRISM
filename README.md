# Urban-PRISM

Smart Urban Grievance Management and Infrastructure Prioritization Platform

## Overview
Urban-PRISM is a full-stack civic operations platform for municipality grievance management. It combines AI-assisted complaint intake, geospatial clustering, SLA governance, field-worker workflows, and public tracking into a single operational system.

The project is designed around Chennai/Tamil Nadu civic workflows and supports Admin, Citizen, and FieldWorker roles.

## What Is Implemented

### Citizen workflows
- Register/login with role-aware access
- Submit grievance with image and location
- AI-assisted category/severity/summary generation
- Duplicate pre-check before submission
- Track grievances and status updates
- Public tracker access by grievance ID
- Post-resolution feedback (rating + comment)
- Multilingual UI (English/Tamil)
- Voice input support for complaint text
- Offline complaint queue (auto-sync when online)

### Admin workflows
- Dashboard risk and trend views
- Asset CRUD management
- Cluster monitoring
- Risk engine execution
- Field-worker verification and filtering
- Task assignment and completion verification
- SLA rule and escalation rule management
- Ward scorecards and ward comparison analytics
- Predictive maintenance insights

### Field worker workflows
- View assigned tasks
- Start work
- Complete with proof image and notes

### Notifications and automation
- Email notifications for lifecycle events
- WhatsApp notifications for grievance acknowledgement and status updates
- Cluster alert scheduler (every 3 days)
- SLA breach scheduler (hourly auto-escalation checks)

## Architecture
- Frontend: React 19 + Vite 7 (SPA)
- Backend: Node.js + Express 5
- Database: MongoDB + Mongoose
- AI: Groq + Google Gemini
- Messaging: SMTP + Twilio WhatsApp
- PWA: vite-plugin-pwa
- Mobile shell: Capacitor Android

## Repo Structure
- client: React frontend app
- server: Express backend API
- docs: detailed project and implementation documentation
- docker: Docker artifacts

## API Surface

### Auth
- POST /api/auth/register
- POST /api/auth/login

### Users
- GET /api/users/profile
- GET /api/users/admin

### Grievances
- POST /api/grievances
- GET /api/grievances/my
- POST /api/grievances/duplicate-check
- PATCH /api/grievances/:id/status

### Public
- GET /api/public/track/:grievanceId
- POST /api/public/feedback
- POST /api/public/translate

### Dashboard
- GET /api/dashboard/top
- GET /api/dashboard/summary
- GET /api/dashboard/risk-trend
- GET /api/dashboard/complaints
- GET /api/dashboard/predictive-maintenance
- POST /api/dashboard/send-alert
- GET /api/dashboard/ward/:ward_id/scorecard
- GET /api/dashboard/wards/scorecards
- GET /api/dashboard/wards/comparison

### SLA
- GET /api/sla/rules
- POST /api/sla/rules
- PATCH /api/sla/rules/:id
- DELETE /api/sla/rules/:id
- GET /api/sla/escalation-rules
- POST /api/sla/escalation-rules
- PATCH /api/sla/escalation-rules/:id
- GET /api/sla/grievance/:grievanceId/status
- GET /api/sla/grievance/:grievanceId/escalations
- POST /api/sla/grievance/:grievanceId/update-status
- GET /api/sla/escalations/summary
- GET /api/sla/breached-grievances

### Other domains
- Clusters: GET /api/clusters
- Assets: GET/POST/PUT/DELETE /api/assets
- Risk: POST /api/risk/run
- AI: POST /api/ai/analyze, /api/ai/translate, /api/ai/chat
- Field workers: /api/field-workers/*
- Task assignments: /api/task-assignments/*
- Health: GET /api/health

## Local Setup

### Prerequisites
- Node.js 20+
- MongoDB

### 1) Install server
```bash
cd server
npm install
```

Create server .env with at least:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
WHATSAPP_DEFAULT_COUNTRY_CODE=+91
```

Run server:
```bash
npm run dev
```

### 2) Install client
```bash
cd ../client
npm install
npm run dev
```

Optional client env:
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_URL=http://localhost:5000/api
```

## Mobile and PWA

### PWA
```bash
cd client
npm run build
npm run preview
```

### Android (Capacitor)
```bash
cd client
npm run mobile:sync
npm run mobile:open:android
```

## Documentation
- Full technical documentation: docs/Urban-PRISM-Complete-Documentation.md
- SLA details: SLA_IMPLEMENTATION_GUIDE.md
- Testing checklist: TESTING_GUIDE.md

## Current Status
- End-to-end grievance lifecycle is implemented
- SLA and escalation governance is implemented
- Public tracking and citizen feedback are implemented
- Ward analytics and predictive maintenance are implemented
- Automated tests are present as placeholders and need expansion

## License
Academic and research usage (project-specific).