# URBAN-PRISM

Smart Urban Grievance Management & Infrastructure Prioritization System

**Built with MERN Stack**

## Overview

URBAN-PRISM is a full-stack smart governance platform designed for Tamil Nadu urban infrastructure management. The system enables citizens to register civic complaints with geolocation and image evidence. Complaints are intelligently processed, clustered to avoid duplicates, mapped to infrastructure assets, and analyzed to compute risk scores and maintenance priorities.

The platform transforms raw grievance data into actionable insights using geospatial logic, rule-based risk modeling, and interactive dashboards.

This project is developed using the MERN stack and follows production-grade software architecture practices.

## Problem Statement

Traditional grievance management systems lack automation, geospatial intelligence, and priority-based decision-making. Duplicate complaints caused by minor GPS variations inflate issue counts and distort analysis.

URBAN-PRISM addresses these issues by:

- Eliminating duplicate complaints using spatial clustering
- Mapping grievances to responsible infrastructure assets
- Computing risk scores using complaint volume and severity
- Generating ranked priority lists for maintenance planning
- Providing analytical dashboards for administrators

## System Architecture

```
Frontend (React) → REST API (Node + Express) → MongoDB
Background Processing → Clustering → Mapping → Risk Engine → Priority Engine → Dashboard
```

The system is divided into:

- Citizen Module
- Admin Module
- Intelligence Engine
- Geospatial Processing Layer
- Notification System

## Technology Stack (MERN)

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Multer (Image Upload)
- JWT (Authentication)
- Winston (Logging)
- dotenv (Environment Configuration)

### Frontend

- React.js
- Vite
- Tailwind CSS
- Axios
- React Query
- Zustand
- Recharts
- Leaflet (Maps)
- Framer Motion
- React Hot Toast

## Dataset

The system uses Tamil Nadu district-based synthetic datasets:

### Assets Dataset

Contains infrastructure details:

- asset_id
- asset_type
- latitude & longitude
- district_name
- ward_id
- last_maintenance_date
- estimated_repair_cost
- service_radius

### Grievances Dataset

Contains complaint details:

- grievance_id
- category
- latitude & longitude
- district_name
- ward_id
- complaint_text
- complaint_date
- severity_level
- status
- complaint_volume

Coordinates are generated district-wise with controlled GPS variations to support realistic clustering.

## Core Features

### Citizen Module

- Register/Login
- Submit grievance with location (Map-based picker)
- Upload images
- Track complaint status
- Receive grievance acknowledgement email on submission
- Receive email notification on status updates

### Admin Module

- View all grievances
- View infrastructure assets
- Add new infrastructure assets
- Edit existing infrastructure assets
- Filter by district, ward, category
- View interactive maps
- View priority ranking
- Analyze risk trends

## Intelligent Clustering

Duplicate complaints are prevented using rule-based spatial clustering.

**Criteria:**

- Same district
- Same ward
- Same category
- Distance within threshold (e.g., 20 meters)
- Active status

Instead of creating multiple records, the system increases the complaint_volume field in the existing grievance record.

This prevents artificial inflation of risk.

## Asset–Grievance Mapping

Each grievance is mapped to an asset using:

- District + ward filtering
- Category-to-asset type mapping
- Nearest asset search using MongoDB geospatial query
- Distance validation using service_radius

Only assets within their service radius are considered valid matches.

## Risk Engine

Risk score is calculated using:

- Complaint volume
- Severity weight
- Complaint recency
- Maintenance age
- Repair cost factor

Risk is normalized between 0 and 100.

## Priority Engine

Assets are ranked using:

- Risk score
- Complaint frequency
- Severity distribution

The system generates a stable priority list for maintenance planning.

## Email Notification System

When a grievance status is updated:

- The registered user receives an automated email
- SMTP configuration is managed through environment variables
- Email failures are logged for retry

## Security Features

- JWT-based authentication
- Role-based access control
- Input validation & sanitization
- Rate limiting
- Centralized error handling
- Structured logging
- Environment variable protection

## Map Features

- Interactive Leaflet map
- Asset markers
- Grievance markers
- Risk-based color coding
- Heatmap visualization
- District & ward filtering

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repository_url>
cd urban-prism
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=your_port
SMTP_USER=your_email
SMTP_PASS=your_password
```

Run backend:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Importing Dataset

Place `assets.csv` and `grievances.csv` in the backend data directory and run the import script:

```bash
npm run import
```

Ensure MongoDB has 2dsphere index on asset location.

## Login Credentials

Use the login credentials to sign in

Admin 
Email : suriya@gmail.com
Password : 123456

User 
Email : jayasuriyajs45@gmail.com
Password : 123456

Field-Worker
Email : kanwalkishore24@gmail.com
Password : 123456

## Future Enhancements

- Predictive maintenance using machine learning
- NLP-based complaint classification
- Real-time updates using WebSockets
- IoT sensor data integration
- Budget optimization engine

## License

This project is developed for academic and research purposes.

## Authors

URBAN-PRISM Development Team
