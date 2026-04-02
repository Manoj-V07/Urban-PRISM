# Urban-PRISM Complete Project Documentation

Last updated: 2026-04-02

## 1) Project Identity
- Project name: Urban-PRISM
- Domain: Smart urban grievance management and infrastructure prioritization
- Target context: Tamil Nadu / Chennai civic operations
- Architecture style: Full-stack MERN-style civic platform with AI-assisted intake, geospatial analytics, SLA governance, and field operations workflow

## 2) Problem Statement
Traditional grievance systems typically work as complaint registries without:
- Duplicate prevention and duplicate guidance for citizens
- Geospatial grouping and asset-level accountability
- SLA-driven response governance with escalation
- Risk-aware, ward-level prioritization and forecasting
- End-to-end public transparency after complaint submission

This results in repeated reports, delayed action, weak prioritization, and limited trust in closure quality.

## 3) Solution Implemented in Urban-PRISM
Urban-PRISM provides an end-to-end civic operations stack with:
- Citizen complaint intake with geolocation and mandatory image evidence
- AI-powered complaint analysis (category, severity, summary)
- AI complaint-image relevance validation before acceptance
- Citizen-side duplicate pre-check before final submission
- Geospatial clustering and complaint-volume consolidation
- Asset mapping using nearest-asset search and fallback matching logic
- Risk scoring for active clusters with weighted component model
- SLA rule engine with due dates, status tracking, and escalation
- Scheduled SLA breach checks and escalation notifications
- Public complaint tracking timeline and post-resolution citizen feedback
- Admin dashboards: risk, trends, ward scorecards, cross-ward comparison
- Predictive maintenance insights for top-risk assets
- Field worker assignment, execution, proof upload, and verification loop
- Email + WhatsApp notifications for lifecycle events
- PWA support, offline complaint queue, and Android-ready Capacitor shell

## 4) High-Level Architecture
- Frontend: React 19 + Vite 7 SPA
- Backend: Node.js + Express 5 API
- Database: MongoDB via Mongoose 9
- AI providers: Groq + Google Gemini
- Scheduler: node-cron
- Messaging: SMTP email + Twilio WhatsApp
- Storage: local uploads directory
- Mobile/PWA: Capacitor Android support + service worker caching + offline queue sync

Primary flow:
1. Citizen submits grievance with image and location
2. AI analyzes complaint and validates image relevance
3. Duplicate pre-check can warn citizen before final submit
4. Grievance is stored and SLA is initialized
5. Clustering + asset mapping run
6. Notifications are sent (email/WhatsApp)
7. Admin monitors dashboards, SLA, and assignments
8. Field worker executes task and uploads proof
9. Admin verifies completion and grievance is resolved
10. Citizen tracks status publicly and can submit closure feedback

## 5) Tech Stack (Verified from Source)

### Backend
- express, mongoose, jsonwebtoken, bcryptjs
- express-validator, express-rate-limit, helmet, morgan
- multer, nodemailer, node-cron, winston
- groq-sdk, @google/genai
- twilio (WhatsApp channel)

### Frontend
- react, react-router-dom, axios
- leaflet + react-leaflet
- i18next + react-i18next
- vite-plugin-pwa
- Capacitor packages + speech recognition plugin

## 6) Backend Features and Modules

### 6.1 Platform and middleware
- Health endpoint: GET /api/health
- Security: helmet, CORS, request ID middleware
- Rate limiting in API middleware layer
- JSON/form parsers
- Static uploads served from /uploads
- Centralized error handler

### 6.2 Authentication and authorization
- JWT register/login
- Roles: Citizen, Admin, FieldWorker
- FieldWorker registration requires workerCategory
- FieldWorker accounts default to unverified
- Role-based middleware and token-only path for AI routes

Auth endpoints:
- POST /api/auth/register
- POST /api/auth/login

### 6.3 User APIs
- GET /api/users/profile (authenticated)
- GET /api/users/admin (admin check)

### 6.4 Grievance lifecycle
Implemented:
- Create grievance with mandatory image and coordinates
- AI analysis fallback to manual category/severity
- AI image-to-text validation
- UUID grievance ID generation
- SLA initialization on create
- Clustering trigger after save
- Acknowledgement notifications (email + WhatsApp)
- Grievance list (admin all / user own)
- Admin status updates with notifications (email + WhatsApp)
- Citizen duplicate pre-check endpoint

Grievance endpoints:
- POST /api/grievances
- GET /api/grievances/my
- POST /api/grievances/duplicate-check
- PATCH /api/grievances/:id/status

### 6.5 Public grievance tracker and citizen feedback
Implemented:
- Public tracker by grievance ID with timeline steps
- Assignment visibility (worker category/name when available)
- Post-resolution citizen rating/comment capture (owner-only)
- Public translation endpoint for tracker UI strings/content

Public endpoints:
- GET /api/public/track/:grievanceId
- POST /api/public/feedback
- POST /api/public/translate

### 6.6 Clustering and asset mapping
Implemented in clustering workflow:
- Nearby active cluster merge (same category + ward)
- Partner grievance time-window logic
- Complaint volume updates from grouped complaints
- Nearest asset mapping with district/ward fallbacks

Cluster endpoint:
- GET /api/clusters

### 6.7 Asset management
Implemented:
- Asset CRUD
- Authenticated read access
- Admin-only writes
- Geo-enabled location model usage

Asset endpoints:
- GET /api/assets
- GET /api/assets/:id
- POST /api/assets
- PUT /api/assets/:id
- DELETE /api/assets/:id

### 6.8 Risk engine
Implemented:
- Risk run for active clusters
- Weighted score components persisted in RiskHistory
- Dashboard retrieval of top/latest cluster risks

Risk endpoint:
- POST /api/risk/run

### 6.9 Dashboard and analytics
Implemented:
- Top risks
- Cluster summary by category and ward
- 30-day risk trend
- Complaint monthly stats
- Manual alert trigger
- Ward scorecards (single/all)
- Cross-ward comparison
- Predictive maintenance insights (next-30-day heuristic)

Dashboard endpoints:
- GET /api/dashboard/top
- GET /api/dashboard/summary
- GET /api/dashboard/risk-trend
- GET /api/dashboard/complaints
- GET /api/dashboard/predictive-maintenance
- POST /api/dashboard/send-alert
- GET /api/dashboard/ward/:ward_id/scorecard
- GET /api/dashboard/wards/scorecards
- GET /api/dashboard/wards/comparison

### 6.10 SLA and escalation governance
Implemented:
- SLA rule CRUD (soft-deactivate)
- SLA due-date calculation from severity/category
- SLA state model: On Track, At Risk, Breached
- Escalation rule management
- Escalation history and summary analytics
- Manual SLA refresh for specific grievance
- Scheduler integration for hourly breach scan and auto-escalation

SLA endpoints:
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

### 6.11 AI services
Implemented:
- Complaint analysis
- Translation
- Chat assistant
- Public translation support for tracker

AI endpoints:
- POST /api/ai/analyze
- POST /api/ai/translate
- POST /api/ai/chat

### 6.12 Field workers and assignments
Field worker management:
- GET /api/field-workers
- GET /api/field-workers/eligible
- PATCH /api/field-workers/:id/verify
- PATCH /api/field-workers/:id/reject
- PATCH /api/field-workers/location

Task assignments:
- POST /api/task-assignments
- GET /api/task-assignments
- GET /api/task-assignments/my
- PATCH /api/task-assignments/:id/start
- PATCH /api/task-assignments/:id/complete
- PATCH /api/task-assignments/:id/verify
- PATCH /api/task-assignments/:id/reject

### 6.13 Notifications and scheduled jobs
Implemented notifications:
- Grievance acknowledgement (email/WhatsApp)
- Grievance status update (email/WhatsApp)
- Task assignment and resolution email flows
- SLA breach escalation emails
- Cluster alert emails

Scheduled jobs:
- Cluster alert every 3 days at 09:00
- SLA breach check every hour (auto-escalation trigger)

## 7) Frontend Features

### 7.1 Routing and role-aware access
- Public pages: Home, Login, Register, Public Tracker
- Protected app shell with role-aware default landing
- Admin-only routes for analytics modules
- Legacy route aliases redirect to /app/* paths
- Safe redirect handling for login query param

### 7.2 Citizen-facing experience
- Grievance creation and list
- Duplicate warning before final submission
- AI-assisted summary/severity/category display
- Track complaint button into public tracker
- Translation helper integration
- Voice input support for complaint text
- Offline queue support for complaint submission when offline

### 7.3 Public tracker experience
- Search by grievance ID
- Timeline of grievance progression
- Status pill and summary panel
- Evidence image rendering
- Post-resolution rating/comment flow
- Optional multilingual rendering via public translation API

### 7.4 Admin experience
- Dashboard and analytics
- Map visualization layers for assets/clusters/grievances
- Asset CRUD interfaces
- Field worker verification and management
- Task assignment and verification console
- SLA Control Center for rules, breaches, escalation history, and ward analytics

### 7.5 Field worker experience
- My Tasks view
- Start/complete task lifecycle
- Proof-image upload with completion notes

### 7.6 Mobile, PWA, and offline
- PWA registration + runtime API/image caching
- Service worker auto-update strategy
- Offline complaint queue in localStorage with auto-sync on reconnect/visibility
- Capacitor Android integration scripts
- Native shell initialization (status bar, keyboard resize, back button behavior)

### 7.7 Internationalization
- i18next enabled with English and Tamil translations
- Role and grievance token mapping for translated UI labels
- Tracker + complaint views use translation hooks

## 8) Data Model Snapshot

Core models:
- User
- Grievance
- Asset
- Cluster
- TaskAssignment
- RiskHistory

SLA models:
- SLA
- SLARule
- SLATracking
- EscalationRule
- EscalationHistory

Other present models:
- Task (legacy)
- Unmatched
- JobLog

Key model additions:
- Grievance includes citizen feedback fields and SLA fields
- User includes phone + whatsappNumber and worker geolocation

## 9) Complete API Catalog

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

### Public Tracker
- GET /api/public/track/:grievanceId
- POST /api/public/feedback
- POST /api/public/translate

### Clusters
- GET /api/clusters

### Assets
- GET /api/assets
- GET /api/assets/:id
- POST /api/assets
- PUT /api/assets/:id
- DELETE /api/assets/:id

### Risk
- POST /api/risk/run

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

### AI
- POST /api/ai/analyze
- POST /api/ai/translate
- POST /api/ai/chat

### Field Workers
- GET /api/field-workers
- GET /api/field-workers/eligible
- PATCH /api/field-workers/:id/verify
- PATCH /api/field-workers/:id/reject
- PATCH /api/field-workers/location

### Task Assignments
- POST /api/task-assignments
- GET /api/task-assignments
- GET /api/task-assignments/my
- PATCH /api/task-assignments/:id/start
- PATCH /api/task-assignments/:id/complete
- PATCH /api/task-assignments/:id/verify
- PATCH /api/task-assignments/:id/reject

### Utilities
- GET /api/health

## 10) Scripts and Operations

### Root
- Root package.json currently includes uuid dependency

### Backend scripts
- npm run dev
- npm start
- npm test (placeholder)

### Frontend scripts
- npm run dev
- npm run build
- npm run lint
- npm run preview
- npm run mobile:copy
- npm run mobile:sync
- npm run mobile:open:android
- npm run mobile:android
- npm run mobile:run:android

### Backend utility scripts
The server/scripts directory includes import, transform, cleanup, backfill, diagnostics, and messaging diagnostics utilities (data pipeline + operational troubleshooting scripts).

## 11) Environment and Configuration

### Backend env
- PORT
- MONGO_URI or MONGODB_URI
- JWT_SECRET
- GROQ_API_KEY
- GEMINI_API_KEY
- SMTP settings for email service
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_WHATSAPP_FROM
- WHATSAPP_DEFAULT_COUNTRY_CODE

### Frontend env
- VITE_API_BASE_URL
- VITE_API_URL

Axios defaults:
- Local: http://localhost:5000
- Fallback deployment: https://urban-prism.onrender.com

## 12) Security and Reliability
- JWT auth and RBAC
- Password hashing (bcryptjs)
- Input validation (express-validator)
- Rate limiting and secure headers
- Request correlation ID logging
- Centralized API error handling
- Upload validation and size/type checks
- Notification failures handled as non-blocking where appropriate

## 13) Testing Status
- Backend test files are present but currently placeholders:
  - server/tests/api.test.js
  - server/tests/auth.test.js
  - server/tests/clustering.test.js
  - server/tests/risk.test.js
- Dedicated frontend automated test suite is not configured in this snapshot
- Manual testing documentation exists in SLA_IMPLEMENTATION_GUIDE.md and TESTING_GUIDE.md

## 14) Known Gaps / Legacy Paths
- Legacy task route/controller pair remains (tasks) while active workflow uses task-assignments
- Some service/controller placeholders exist and are partially implemented or unused in active route wiring
- Root README still references some packages not present in current client dependencies
- Docker artifacts exist but are not fully hardened for production rollout

## 15) Current Strengths and Next Priorities
Strongly implemented areas:
- Full grievance-to-resolution operational loop
- SLA governance with automated escalation
- Public transparency and citizen feedback capture
- Ward analytics + predictive maintenance insights
- Offline/PWA/mobile-readiness for field practicality

Priority improvement areas:
- Automated test coverage (unit/integration/e2e)
- Final cleanup of legacy/unused modules and docs consistency
- Docker/deployment hardening and observability expansion
- KPI baselines for SLA compliance and citizen satisfaction tracking over time
