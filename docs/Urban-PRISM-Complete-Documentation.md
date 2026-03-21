# Urban-PRISM Complete Project Documentation

## 1) Project Identity
- Project name: Urban-PRISM
- Domain: Smart urban grievance management and infrastructure prioritization
- Target context: Tamil Nadu / Chennai civic operations (as reflected in data naming and defaults)
- Architecture style: MERN-style full stack with geospatial processing, AI-assisted complaint handling, and admin operations dashboard

## 2) Problem Statement
Traditional grievance systems are usually complaint registries without intelligence for:
- Duplicate complaint prevention (same issue reported repeatedly with slight coordinate variation)
- Spatial grouping and asset-level reasoning
- Risk-based prioritization for maintenance planning
- Operational assignment and verification workflows for field workers

This causes inflated complaint counts, delayed action, and weak maintenance prioritization.

## 3) Solution Implemented in Urban-PRISM
Urban-PRISM addresses these pain points using:
- Citizen complaint intake with geolocation + image evidence
- AI-assisted complaint understanding (category, severity, summary)
- AI-based image-to-complaint relevance check
- Geospatial clustering of related complaints
- Asset linkage by ward/district and nearest-asset logic
- Risk score generation for active clusters
- Admin dashboards (top risks, summaries, trends)
- Field worker verification, eligibility filtering, assignment, proof upload, and admin verification
- Email notifications for key lifecycle events
- Scheduled cluster alert emails to admins

## 4) High-Level Architecture
- Frontend: React + Vite SPA
- Backend: Node.js + Express API
- Database: MongoDB via Mongoose
- AI providers: Groq + Google Gemini
- Background processing: node-cron scheduler
- Storage: local uploads directory for images

Data flow:
1. Citizen submits complaint
2. AI analysis + image verification
3. Complaint persisted
4. Clustering and asset mapping executed
5. Admin runs risk engine / views dashboard
6. Admin assigns worker
7. Worker completes with proof
8. Admin verifies and closes grievance

## 5) Tech Stack (Verified from Source)

### Backend runtime and libraries
- Node.js, Express 5
- Mongoose 9
- JWT auth (`jsonwebtoken`)
- Password hashing (`bcryptjs`)
- Validation (`express-validator`)
- Rate limiting (`express-rate-limit`)
- Security headers (`helmet`)
- Request logging (`morgan`)
- App logging (`winston`)
- File upload (`multer`)
- Email (`nodemailer`)
- Scheduling (`node-cron`)
- AI SDKs (`groq-sdk`, `@google/genai`)
- Env loading (`dotenv`)

### Frontend runtime and libraries
- React 19
- React Router DOM 7
- Vite 7
- Axios
- Leaflet + react-leaflet
- PWA plugin (`vite-plugin-pwa`)

### Deployment and infra artifacts
- Vercel config present (`vercel.json`) with SPA fallback
- Docker artifacts present (`docker/DockerFile`, `docker/docker-compose.yml`), but not fully configured for active use

## 6) Backend Modules and Features

### 6.1 App and middleware platform
- Health endpoint: `GET /api/health`
- Security middleware: helmet + CORS
- Request ID middleware
- Rate limiting: 200 requests per 15 minutes per IP
- JSON/form body parsers
- Static upload serving at `/uploads`
- Centralized error handler

### 6.2 Authentication and authorization
- Register and login using JWT
- Roles: `Citizen`, `Admin`, `FieldWorker`
- Field worker registration requires `workerCategory` and defaults to unverified
- Role-based route protection middleware
- Token-only auth path used for AI routes

Auth API:
- `POST /api/auth/register`
- `POST /api/auth/login`

### 6.3 User profile/admin check
User API:
- `GET /api/users/profile` (any authenticated user)
- `GET /api/users/admin` (admin-only access check)

### 6.4 Grievance lifecycle
Features implemented:
- Citizen grievance creation with required image upload and coordinates
- AI complaint analysis fallback logic
- AI image relevance check against complaint text
- UUID grievance ID generation
- Complaint save with geospatial point
- Post-create clustering trigger
- Acknowledgement email to citizen
- Fetch user grievances (admin gets all, others get own)
- Admin status updates with status-update email

Grievance API:
- `POST /api/grievances`
- `GET /api/grievances/my`
- `PATCH /api/grievances/:id/status`

### 6.5 Clustering and asset mapping
Features implemented in clustering flow:
- Nearby active cluster merge within 500m for same category + ward
- Partner grievance search window: 30 days
- Cluster creation only when a nearby partner grievance is found
- Complaint volume update from cluster size
- Asset mapping via nearest search (max 1000m) with fallback sequence:
  - exact district + ward
  - same ward nearby
  - same district nearby
  - same ward fallback
  - same district fallback

Cluster API:
- `GET /api/clusters` (admin)

### 6.6 Asset management
Features implemented:
- Asset CRUD
- Pagination and filtering in list endpoint
- Asset geospatial storage and query support

Asset API:
- `GET /api/assets`
- `GET /api/assets/:id`
- `POST /api/assets` (admin)
- `PUT /api/assets/:id` (admin)
- `DELETE /api/assets/:id` (admin)

### 6.7 Risk engine
Features implemented:
- Risk computation for active clusters with grievances
- Weighted score components:
  - severity (25%)
  - recency (20%)
  - complaint volume (20%)
  - maintenance age (20%)
  - repair cost (15%)
- Risk score persisted in `RiskHistory`

Risk API:
- `POST /api/risk/run` (admin)

### 6.8 Dashboard and analytics APIs
Features implemented:
- Top risk clusters (latest risk per cluster, top 10)
- Cluster summary totals and grouped category/ward stats
- 30-day risk trend
- Complaint monthly stats (pending/resolved/high severity counts)
- Manual cluster alert trigger

Dashboard API:
- `GET /api/dashboard/top`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/risk-trend`
- `GET /api/dashboard/complaints`
- `POST /api/dashboard/send-alert`

### 6.9 AI services
Features implemented:
- Complaint analysis API
- Translation API
- Chat assistant API
- Groq-first strategy with Gemini fallback for some flows
- Image-text validation using Gemini multimodal input

AI API:
- `POST /api/ai/analyze`
- `POST /api/ai/translate`
- `POST /api/ai/chat`

### 6.10 Field worker management
Features implemented:
- List workers by verification/category filters
- Verify/reject worker
- Eligibility retrieval by grievance category mapping and proximity
- Worker location updates
- Category keyword mapping to worker type

Field worker API:
- `GET /api/field-workers`
- `GET /api/field-workers/eligible`
- `PATCH /api/field-workers/:id/verify`
- `PATCH /api/field-workers/:id/reject`
- `PATCH /api/field-workers/location`

### 6.11 Task assignment and completion workflow
Features implemented:
- Admin assigns grievance to verified worker
- Category compatibility check
- Prevent duplicate active assignment for same grievance
- Assignment listing and worker-specific task listing
- Worker starts task
- Worker completes with mandatory proof image and notes
- Admin verifies completion:
  - assignment -> `Verified`
  - grievance -> `Resolved`
  - asset maintenance date updated
  - citizen notification email sent
  - worker active task count decremented
- Admin reject flow for completed tasks (reassign cycle)

Task assignment API:
- `POST /api/task-assignments`
- `GET /api/task-assignments`
- `GET /api/task-assignments/my`
- `PATCH /api/task-assignments/:id/start`
- `PATCH /api/task-assignments/:id/complete`
- `PATCH /api/task-assignments/:id/verify`
- `PATCH /api/task-assignments/:id/reject`

### 6.12 Email and scheduler
Email events implemented:
- Grievance acknowledgement
- Grievance status update
- Task assignment
- Grievance resolution notification
- Cluster alert report to admins

Scheduled jobs:
- Cluster alert job every 3 days at 09:00 (`0 9 */3 * *`)

## 7) Frontend Application Features

### 7.1 Authentication and route protection
- Login and registration flows
- Role-aware landing route:
  - Admin -> Dashboard
  - FieldWorker -> My Tasks
  - Citizen -> Grievances
- ProtectedRoute supports admin-only and worker-only checks
- Unverified field worker sees verification-pending panel

### 7.2 Main layout and global UI
- Header navigation rendered by role
- User identity and role badge in header
- Logout action
- Global floating AI chatbot present in layout

### 7.3 Citizen-facing pages and capabilities
- Grievances page:
  - submit complaints via form
  - image upload support
  - list own complaints with status/severity display
  - translation utility integration
- File Complaint route points to grievance submission experience

### 7.4 Field worker pages and capabilities
- My Tasks page:
  - fetch assigned tasks
  - start tasks
  - upload proof image for completion
  - submit optional completion notes

### 7.5 Admin pages and capabilities
- Dashboard:
  - top risks, summary cards, trend/complaint panels
  - trigger risk engine
  - send cluster alert
- Analytics:
  - dashboard data visual analysis
- Map view:
  - cluster and asset visual layers
  - map rendering with reusable map components
- Assets:
  - asset list + add/edit/update flows
- Field Workers:
  - list/filter/verify/reject workers
- Task Assignments:
  - list assignments, pull eligible workers, assign tasks, verify/reject completed tasks

### 7.6 Reusable frontend building blocks
- Common components: Loader, Modal, Toast
- Dashboard components: Charts, Filters, RiskTable
- Forms: Asset form + create/edit modals, grievance form
- Map components: MapContainer, HeatmapLayer, ClusterMarkers, AssetMarkers, GrievanceMarkers, FitBounds

### 7.7 Frontend APIs, hooks, and helpers
- Centralized endpoint constants
- Axios base URL + JWT interceptor
- Auth context provider with login/register/logout
- Custom hooks: `useAuth`, `useFetch`, `useMap`, `useVoiceInput`
- Utility helpers: token/user persistence, role checks, risk-level color helpers, formatters, constants

## 8) Data Model Documentation

### User
- Identity and auth fields
- Role and worker category
- Verification state
- Geolocation point and active task count

### Grievance
- UUID grievance ID
- Category, severity, summary, status, complaint text/date
- District and ward metadata
- GeoJSON location
- Image path
- complaint volume and optional asset reference
- creator reference

### Asset
- Asset identifiers and type
- District/ward metadata
- GeoJSON location
- maintenance date
- estimated repair cost
- service radius

### Cluster
- Category and geolocation
- district/ward
- grievance references
- complaint volume
- optional mapped asset reference
- active status

### TaskAssignment
- grievance, assigned worker/admin refs
- lifecycle status
- proof image URL and completion notes
- completion/verification timestamps
- rejection reason

### RiskHistory
- cluster reference
- score
- component breakdown
- created timestamp (used for trend analytics)

### Additional collections/models
- `unmatched` model exists for unmatched grievance tracking
- `task` model exists as legacy alongside `taskAssignment`
- `jobLog` model exists for job tracking use cases

## 9) API Catalog (Complete Route Map)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Users
- `GET /api/users/profile`
- `GET /api/users/admin`

### Grievances
- `POST /api/grievances`
- `GET /api/grievances/my`
- `PATCH /api/grievances/:id/status`

### Clusters
- `GET /api/clusters`

### Assets
- `GET /api/assets`
- `GET /api/assets/:id`
- `POST /api/assets`
- `PUT /api/assets/:id`
- `DELETE /api/assets/:id`

### Risk
- `POST /api/risk/run`

### Dashboard
- `GET /api/dashboard/top`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/risk-trend`
- `GET /api/dashboard/complaints`
- `POST /api/dashboard/send-alert`

### AI
- `POST /api/ai/analyze`
- `POST /api/ai/translate`
- `POST /api/ai/chat`

### Field Workers
- `GET /api/field-workers`
- `GET /api/field-workers/eligible`
- `PATCH /api/field-workers/:id/verify`
- `PATCH /api/field-workers/:id/reject`
- `PATCH /api/field-workers/location`

### Task Assignments
- `POST /api/task-assignments`
- `GET /api/task-assignments`
- `GET /api/task-assignments/my`
- `PATCH /api/task-assignments/:id/start`
- `PATCH /api/task-assignments/:id/complete`
- `PATCH /api/task-assignments/:id/verify`
- `PATCH /api/task-assignments/:id/reject`

### Platform utility
- `GET /api/health`

## 10) Scripts and Operational Utilities

### Root
- Root `package.json` currently only declares `uuid` dependency

### Backend scripts
- `npm run dev`: starts nodemon server
- `npm start`: starts production server
- `npm test`: placeholder (no runnable suite configured)

### Frontend scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

### Data and maintenance scripts in `server/scripts`
- Import, transform, normalize, cleanup, backfill, seeding, and diagnostics scripts are present:
  - `importAssets.js`, `importGrievances.js`, `importChennaiData.mjs`, `importAtlasChennai.mjs`
  - `transformAssets.mjs`, `transformGrievances.mjs`, `processGrievances.mjs`
  - `createAdmin.mjs`, `seedClusterGrievances.mjs`, `seedDemoUsers.jsx`
  - `resetDatabase.js`, `cleanupCollections.mjs`, `backfillClusterAssets.mjs`
  - `fixImagePaths.mjs`, `fixLeadingSlashes.mjs`, `normalizeGrievanceImagePaths.mjs`
  - diagnostics: `_categoryImageStats.mjs`, `_inspectGrievanceImages.mjs`, `_legacyImageFieldCounts.mjs`, `checkClusterStats.mjs`

## 11) Security and Reliability Features
- JWT authentication and RBAC enforcement
- Password hashing with bcrypt
- Request validation
- Rate limiting
- Helmet headers
- CORS
- Centralized error handling
- Request ID tagging for logs
- File type/size restrictions for uploads

## 12) Testing Status
- Backend test files exist but are currently empty:
  - `server/tests/api.test.js`
  - `server/tests/auth.test.js`
  - `server/tests/clustering.test.js`
  - `server/tests/risk.test.js`
- No active frontend test suite detected

## 13) Current Gaps, Legacy Paths, and Clarifications
This section distinguishes implemented production behavior from partial/legacy code so the project status is transparent.

- Some files are present but empty/incomplete:
  - `server/src/services/analyticsService.js`
  - `server/src/services/geoService.js`
  - `server/src/jobs/jobLock.js`
  - `server/src/controllers/notifications.js`
  - `server/src/controllers/users.js`
  - backend test files listed above
- Legacy task route/controller pair also exists (`server/src/routes/tasks.js`, `server/src/controllers/tasks.js`) while active app wiring uses task-assignments routes.
- Frontend includes pages/components not wired in main route tree for default navigation (`TaskManagement.jsx`, `Workers.jsx`), indicating iterative/legacy UI paths.
- Root README includes some stack items (for example, Zustand, React Query, Tailwind, Framer Motion, Recharts) that are not currently reflected as dependencies in `client/package.json` in this workspace snapshot.

## 14) Environment and Configuration Notes
Backend uses:
- `PORT`
- `MONGO_URI` or `MONGODB_URI`
- `JWT_SECRET`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- SMTP settings used by mail service

Frontend uses:
- `VITE_API_BASE_URL`
- `VITE_API_URL`

Axios defaults:
- Local API origin: `http://localhost:5000`
- Fallback deployed origin: `https://urban-prism.onrender.com`

## 15) Conclusion
Urban-PRISM is a complete end-to-end civic grievance intelligence platform with implemented capabilities spanning complaint capture, AI-assisted analysis, geospatial clustering, risk scoring, administrative monitoring, worker operations, notifications, and scheduled alerting.

The strongest implemented areas are:
- Core API lifecycle and role-driven workflows
- Geospatial clustering and risk orchestration
- Admin operation tooling
- Field assignment and verification loops

The major improvement areas are:
- Automated test coverage
- Cleanup of legacy/unused modules
- Finalization of currently empty service/controller placeholders
- Optional DevOps hardening for Docker-based deployment
