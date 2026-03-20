# SLA & Escalation Management System - Implementation Guide

## Overview

This document describes the three newly implemented features for Urban PRISM:

1. **SLA Engine** - Automatic due date calculation based on severity/category
2. **Auto-Escalation** - Scheduled job that detects SLA breaches and escalates them
3. **Ward Performance Scorecards** - Comprehensive governance metrics and dashboards

---

## Feature 1: SLA Engine

### Purpose
The SLA Engine automatically calculates and tracks Service Level Agreement due dates for each grievance based on predefined rules. This ensures consistent timeframes across different severity levels and complaint categories.

### Key Components

#### Models
- **SLARule** (`server/src/models/slaRule.js`)
  - Defines resolution timeframes by severity_level and category
  - Example: High severity → 24 hours, Medium → 3 days, Low → 7 days
  - Supports custom rules per category or general rules

#### Service
- **slaEngineService.js** (`server/src/services/slaEngineService.js`)
  - `getSLARuleForGrievance()` - Find applicable rule (specific → general → default)
  - `calculateSLADueDate()` - Compute due date from complaint date and rule
  - `initializeSLAForGrievance()` - Set initial SLA on grievance creation
  - `checkSLAStatus()` - Check current status (On Track / At Risk / Breached)
  - `updateGrievanceSLAStatus()` - Update status in database
  - `getBreachedGrievances()` - Find all breached grievances for escalation
  - `getWardSLAMetrics()` - Ward-level SLA metrics for scorecards

#### Database Fields (Grievance Model)
```javascript
sla_due_date: Date       // When grievance must be resolved
sla_status: String       // "On Track", "At Risk", "Breached"
sla_breached_at: Date    // When breach was detected
sla_escalated_at: Date   // When escalation was triggered
```

### How It Works

1. **Initialization**
   - When a new grievance is created, `initializeSLAForGrievance()` is automatically called
   - The appropriate SLA rule is found based on severity + category
   - Due date is calculated and stored

2. **Status Tracking**
   - "On Track" - Within 80% of timeframe
   - "At Risk" - 80%+ of timeframe used
   - "Breached" - Due date has passed

3. **Default Rules** (auto-initialized)
   ```
   High Severity → 24 hours response time
   Medium Severity → 3 days (72 hours) response time
   Low Severity → 7 days (168 hours) response time
   ```

### API Endpoints

**Admin Only:**
- `GET /api/sla/rules` - List all SLA rules
- `POST /api/sla/rules` - Create new SLA rule
- `PATCH /api/sla/rules/:id` - Update SLA rule
- `DELETE /api/sla/rules/:id` - Deactivate SLA rule

**Example SLA Rule Creation:**
```bash
POST /api/sla/rules
{
  "rule_name": "High Priority Electricity",
  "severity_level": "High",
  "category": "Electricity",
  "response_hours": 24,
  "escalation_strategy": "auto",
  "notes": "Critical infrastructure"
}
```

---

## Feature 2: Auto-Escalation

### Purpose
Automatically escalates breached SLAs according to predefined rules, sending notifications to appropriate administrators and tracking the escalation history for audit purposes.

### Key Components

#### Models
- **EscalationRule** (`server/src/models/escalationRule.js`)
  - Defines when and how to escalate breached SLAs
  - Example: After 2 hours → escalate to Ward Officer, After 8 hours → escalate to District Admin
  
- **EscalationHistory** (`server/src/models/escalationHistory.js`)
  - Audit trail of all escalation actions
  - Tracks: who was escalated to, when, breach hours, resolution status

#### Service
- **slaEscalationService.js** (`server/src/services/slaEscalationService.js`)
  - `checkAndEscalateSLABreaches()` - Main job function (called hourly by scheduler)
  - `escalateGrievanceSLA()` - Escalate a single breached grievance
  - `getEscalationHistory()` - Fetch escalation audit trail
  - `getEscalationSummary()` - Statistics on escalations
  - `markEscalationResolved()` - Mark escalation as resolved
  - `initializeDefaultEscalationRules()` - Set up default escalation rules

#### Email Integration
- **emailService.js** includes new `sendSLABreachNotification()` function
  - Sends urgent notifications to escalation recipients
  - Includes grievance details and breach duration

### How It Works

1. **Scheduled Job**
   - Runs every hour (configured in `scheduler.js`)
   - Finds all non-resolved grievances with breached SLAs
   - For each breach, applies highest-priority escalation rule

2. **Escalation Logic**
   ```
   Breach detected → Fetch escalation rules → Sort by priority
   → Apply matching rule (e.g., 2+ hours threshold met)
   → Send notifications to specified roles/users
   → Create escalation history entry
   ```

3. **Default Escalation Rules** (auto-initialized)
   ```
   2 hours breach → Escalate to Admin
   8 hours breach → Escalate to Admin
   24 hours breach → Escalate to Admin
   ```

4. **Notification**
   - Recipients receive email with:
     - Grievance ID and category
     - Severity level and location
     - Breach duration
     - Complaint text snippet
     - Action required

### API Endpoints

**Admin Only:**
- `GET /api/sla/escalation-rules` - List all escalation rules
- `POST /api/sla/escalation-rules` - Create new escalation rule
- `PATCH /api/sla/escalation-rules/:id` - Update escalation rule
- `GET /api/sla/escalations/summary` - Get escalation statistics
- `GET /api/sla/breached-grievances` - List currently breached grievances
- `GET /api/sla/grievance/:grievanceId/escalations` - Escalation history for a grievance

**Example Escalation Rule Creation:**
```bash
POST /api/sla/escalation-rules
{
  "rule_name": "Critical Breach - 24 Hours",
  "breach_hours_threshold": 24,
  "escalate_to_roles": ["Admin"],
  "notification_template": "sla_breach_24h",
  "priority": 30
}
```

---

## Feature 3: Ward Performance Scorecards

### Purpose
Provides comprehensive governance metrics at ward level, including resolution rates, average resolution time, SLA compliance, citizen satisfaction, and category-wise performance. Enables measurable accountability and identifies underperforming areas.

### Key Components

#### Service
- **wardScorecardService.js** (`server/src/services/wardScorecardService.js`)
  - `generateWardScorecard(ward_id)` - Generate full scorecard for a ward
  - `getAllWardScorecards()` - Generate scorecards for all wards
  - `getWardComparison()` - Comparative analysis across all wards
  - Helper functions for resolution time, top categories, severity distribution

### Metrics Included

**Summary Metrics**
- Total grievances, Resolved count, Pending count, In Progress count
- Resolution rate (%)
- Average resolution time (hours)
- Average citizen satisfaction (1-5 star rating)
- Oldest pending grievance (days outstanding)

**SLA Metrics**
- Total grievances with SLA, Resolved within SLA, Breached count
- SLA compliance rate (%)
- On Track, At Risk, Breached counts

**Category Breakdown**
- Top 10 complaint categories by volume
- Category-wise resolution rates
- Category-wise citizen satisfaction

**Severity Distribution**
- Breakdown by High, Medium, Low severity
- Count and percentage for each

**Performance Grade**
- A (Excellent): Score ≥ 90
- B (Good): Score ≥ 80
- C (Satisfactory): Score ≥ 70
- D (Needs Improvement): Score ≥ 60
- F (Critical): Score < 60

Weighted scoring:
- 40% Resolution Rate
- 40% SLA Compliance
- 20% Citizen Satisfaction

### Database Queries
Optimized aggregation pipelines for:
- Fast metric calculation even with large datasets
- Resolution time analysis
- Category grouping and ranking
- Severity distribution

### API Endpoints

**Admin Only:**
- `GET /api/dashboard/ward/:ward_id/scorecard` - Get scorecard for specific ward
- `GET /api/dashboard/wards/scorecards` - Get scorecards for all wards
- `GET /api/dashboard/wards/comparison` - Comparative analysis

**Example Response:**
```json
{
  "ward_id": "W001",
  "generated_at": "2024-03-20T10:30:00Z",
  "summary": {
    "total_grievances": 542,
    "resolved": 423,
    "pending": 45,
    "in_progress": 74,
    "resolution_rate": 78.04,
    "avg_resolution_time_hours": 156.5,
    "avg_citizen_satisfaction": 4.2,
    "oldest_pending_days": 28
  },
  "sla_metrics": {
    "total": 542,
    "resolved": 423,
    "breached": 18,
    "on_track": 412,
    "at_risk": 76,
    "sla_compliance_rate": 96.67
  },
  "top_categories": [
    {
      "category": "Drainage",
      "total_complaints": 145,
      "resolved": 133,
      "resolution_rate": 91.72,
      "avg_citizen_rating": 4.5
    }
  ],
  "severity_distribution": [
    {
      "severity": "High",
      "total": 89,
      "resolved": 78,
      "percentage": 16.42
    }
  ],
  "performance_grade": {
    "grade": "A",
    "label": "Excellent"
  }
}
```

---

## Integration Points

### 1. Grievance Creation Flow
```
Citizen submits complaint
  ↓
Grievance model created
  ↓
initializeSLAForGrievance() called
  ↓
SLA fields populated (due_date, status="On Track")
```

### 2. Scheduled Job Flow
```
Every hour (00:00 of each hour):
  ↓
checkAndEscalateSLABreaches() executes
  ↓
Fetch all breached grievances
  ↓
For each: Find applicable escalation rule
  ↓
Send notifications to recipients
  ↓
Create escalation history entries
```

### 3. Admin Monitoring Flow
```
Admin access dashboard
  ↓
View scorecards for wards
  ↓
Identify breached grievances
  ↓
Use SLA endpoints to view rules and history
  ↓
Adjust SLA/Escalation rules if needed
```

---

## Configuration & Customization

### Default SLA Rules
Edit these in `slaEngineService.js` → `initializeDefaultSLARules()`:
```javascript
{
  rule_name: "High Severity - Critical",
  severity_level: "High",
  category: null,
  response_hours: 24,
  escalation_strategy: "auto"
}
```

### Default Escalation Rules
Edit in `slaEscalationService.js` → `initializeDefaultEscalationRules()`:
```javascript
{
  rule_name: "Escalate at 2 Hours Breach",
  breach_hours_threshold: 2,
  escalate_to_roles: ["Admin"],
  priority: 10
}
```

### Scheduler Configuration
The SLA escalation job runs on this cron schedule (in `scheduler.js`):
```javascript
"0 * * * *"  // Every hour at minute 00
```

To change frequency, modify the cron expression.

---

## Error Handling

All services include comprehensive error handling:
- Failed email notifications don't block escalation process
- Database errors are logged but don't crash the scheduler
- Graceful fallbacks when SLA rules not found
- Null checks on all optional fields

---

## Database Indexes

The implementation includes optimized indexes for performance:
- `sla_due_date, sla_status` - For SLA status queries
- `sla_breached_at` - For breach detection
- `escalation_status, priority` - For escalation rules
- Geographic index on grievance location (existing)

---

## Testing Checklist

- [ ] Create a grievance and verify SLA due_date is calculated
- [ ] Check that sla_status is "On Track" on new grievances
- [ ] Wait for scheduler (or manually call /api/sla/grievance/:id/update-status) to test status changes
- [ ] Verify escalation email sent when SLA breached
- [ ] Generate ward scorecard and verify metrics accuracy
- [ ] Create custom SLA/Escalation rules via APIs
- [ ] Check escalation history for a grievance
- [ ] Compare performance across multiple wards

---

## Files Modified/Created

### New Files
- `server/src/models/slaRule.js`
- `server/src/models/escalationRule.js`
- `server/src/models/escalationHistory.js`
- `server/src/services/slaEngineService.js`
- `server/src/services/slaEscalationService.js`
- `server/src/services/wardScorecardService.js`
- `server/src/controllers/sla.js`
- `server/src/routes/sla.js`

### Modified Files
- `server/src/models/grievance.js` - Added SLA fields
- `server/src/services/emailService.js` - Added SLA breach notification
- `server/src/controllers/grievances.js` - Init SLA on creation
- `server/src/controllers/dashboard.js` - Added scorecard endpoints
- `server/src/routes/dashboard.js` - Added scorecard routes
- `server/src/jobs/scheduler.js` - Added SLA escalation job
- `server/src/app.js` - Mounted SLA routes
- `server/src/server.js` - Initialize default rules on startup

---

## Compliance & Governance

These features directly enable:
- **SLA Tracking** - Measurable response times
- **Escalation Management** - Automatic handling of breaches
- **Performance Accountability** - Ward-level scorecards
- **Audit Trail** - Complete history of escalations
- **Citizen Satisfaction** - Tracked and included in scorecards
- **Compliance Reporting** - SLA metrics for governance

All three features work together to ensure transparent, measurable, and compliant grievance management.
