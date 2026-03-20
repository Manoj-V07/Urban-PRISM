# SLA & Escalation Features - Complete Testing Guide

## Prerequisites

### 1. Environment Setup
Ensure your `.env` file has these configured:
```env
MONGO_URI=mongodb://localhost:27017/urban-prism
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM_NAME=Urban PRISM
```

### 2. Database Connection
```bash
# Verify MongoDB is running
mongosh
# Should connect successfully
```

### 3. Start the Server
```bash
cd server
npm install  # If needed
npm start
```

Watch for these initialization logs:
```
[SLAEngine] Default SLA rules initialized
[SLAEscalation] Default escalation rules initialized
[Scheduler] All cron jobs registered.
```

---

## Feature 1: SLA Engine Testing

### Test 1.1: Verify Default Rules Were Created

**API Call:**
```bash
curl -X GET http://localhost:5000/api/sla/rules \
  -H "Cookie: token=YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
[
  {
    "_id": "...",
    "rule_name": "High Severity - Critical",
    "severity_level": "High",
    "category": null,
    "response_hours": 24,
    "escalation_strategy": "auto",
    "active": true
  },
  {
    "rule_name": "Medium Severity - Standard",
    "severity_level": "Medium",
    "response_hours": 72
  },
  {
    "rule_name": "Low Severity - Standard",
    "severity_level": "Low",
    "response_hours": 168
  }
]
```

**Verification:**
- ✅ Should return 3 default rules
- ✅ High = 24 hours, Medium = 72 hours, Low = 168 hours

---

### Test 1.2: Create a Grievance and Verify SLA Calculation

**Step 1: Login as Citizen**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "citizen@example.com",
    "password": "password123"
  }'
```

Save the returned `token`.

**Step 2: Submit a Grievance**
```bash
# First, create a complaint image file or use an existing one
curl -X POST http://localhost:5000/api/grievances \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "category=Drainage" \
  -F "latitude=13.0827" \
  -F "longitude=80.2707" \
  -F "district_name=Chennai" \
  -F "ward_id=W001" \
  -F "complaint_text=Drainage blocked near market" \
  -F "severity_level=High"
```

**Expected Response:**
```json
{
  "grievance_id": "550e8400-e29b-41d4-a716-446655440000",
  "category": "Drainage",
  "severity_level": "High",
  "status": "Pending",
  "sla_due_date": "2024-03-21T10:30:00Z",
  "sla_status": "On Track",
  "sla_breached_at": null,
  "sla_escalated_at": null
}
```

**Verification:**
- ✅ `sla_due_date` should be ~24 hours from now (High severity → 24 hours)
- ✅ `sla_status` should be "On Track"
- ✅ `sla_breached_at` should be null
- ✅ Grievance ID is unique and correct

---

### Test 1.3: Check SLA Status Manually

**API Call:**
```bash
curl -X GET "http://localhost:5000/api/sla/grievance/GRIEVANCE_ID/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Replace `GRIEVANCE_ID` with the ID from Test 1.2.

**Expected Response (On Track):**
```json
{
  "status": "On Track",
  "hoursRemaining": 23.5,
  "percentageUsed": 2.1
}
```

**Verification:**
- ✅ Status is "On Track" (< 80% of timeframe used)
- ✅ hoursRemaining is positive and decreasing over time
- ✅ percentageUsed increases as time passes

---

### Test 1.4: Create a Custom SLA Rule

**API Call:**
```bash
curl -X POST http://localhost:5000/api/sla/rules \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_name": "Electricity - Emergency",
    "severity_level": "High",
    "category": "Electricity",
    "response_hours": 12,
    "escalation_strategy": "auto",
    "notes": "Power outages need faster response"
  }'
```

**Expected Response:**
```json
{
  "_id": "...",
  "rule_name": "Electricity - Emergency",
  "severity_level": "High",
  "category": "Electricity",
  "response_hours": 12,
  "active": true
}
```

**Verification:**
- ✅ Rule created with specific category
- ✅ Custom response_hours (12) is saved
- ✅ Active by default

**Test It:**
- Create a new Electricity complaint with High severity
- Check that `sla_due_date` is ~12 hours from now (not 24)

---

### Test 1.5: Database Verification

**Connect to MongoDB:**
```bash
mongosh
use urban-prism
```

**Check SLA Rules:**
```javascript
db.slarules.find().pretty()
// Should show 3+ rules
```

**Check Grievance with SLA:**
```javascript
db.grievances_chennai_only.findOne(
  { grievance_id: "YOUR_GRIEVANCE_ID" }
)
// Should show sla_due_date, sla_status fields
```

**Verification Checklist:**
- ✅ SLARule documents exist
- ✅ Grievance has sla_due_date (Date object)
- ✅ Grievance has sla_status = "On Track"

---

## Feature 2: Auto-Escalation Testing

### Test 2.1: Verify Default Escalation Rules

**API Call:**
```bash
curl -X GET http://localhost:5000/api/sla/escalation-rules \
  -H "Cookie: token=YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
[
  {
    "rule_name": "Escalate at 2 Hours Breach",
    "breach_hours_threshold": 2,
    "escalate_to_roles": ["Admin"],
    "priority": 10
  },
  {
    "rule_name": "Escalate at 8 Hours Breach",
    "breach_hours_threshold": 8,
    "priority": 20
  },
  {
    "rule_name": "Escalate at 24 Hours Breach",
    "breach_hours_threshold": 24,
    "priority": 30
  }
]
```

**Verification:**
- ✅ 3 escalation rules exist
- ✅ Thresholds are 2h, 8h, 24h
- ✅ Priority ordering: 2h < 8h < 24h

---

### Test 2.2: Create a Test Escalation Rule

**API Call:**
```bash
curl -X POST http://localhost:5000/api/sla/escalation-rules \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rule_name": "Immediate Escalation",
    "breach_hours_threshold": 0.5,
    "escalate_to_roles": ["Admin"],
    "notification_template": "urgent_breach",
    "priority": 5
  }'
```

**Expected Response:**
```json
{
  "_id": "...",
  "rule_name": "Immediate Escalation",
  "breach_hours_threshold": 0.5,
  "active": true
}
```

**Verification:**
- ✅ Rule created successfully
- ✅ Can create custom escalation rules

---

### Test 2.3: Manually Trigger Escalation Job (For Testing)

**Method 1: Using Postman / curl**

First, create a grievance with very old complaint_date to simulate breach:

```javascript
// MongoDB: Create test grievance with old complaint_date
db.grievances_chennai_only.insertOne({
  grievance_id: "test-breach-" + Date.now(),
  category: "TestCategory",
  complaint_date: new Date(Date.now() - 48 * 60 * 60 * 1000),  // 48 hours ago
  severity_level: "High",
  status: "Pending",
  sla_due_date: new Date(Date.now() - 24 * 60 * 60 * 1000),  // Due 24 hours ago
  sla_status: "On Track",
  sla_breached_at: null,
  sla_escalated_at: null,
  location: { type: "Point", coordinates: [80.2707, 13.0827] },
  district_name: "Chennai",
  ward_id: "W001",
  complaint_text: "Test complaint for escalation",
  image_url: "/uploads/test.jpg",
  createdBy: ObjectId("..."),  // Use a valid admin ID
  timestamps: { createdAt: new Date(), updatedAt: new Date() }
})
```

**Method 2: Check Scheduler Logs**

The scheduler runs automatically every hour. Check server logs:

```
[Scheduler] Triggering SLA breach check job…
[SLAEscalation] Starting SLA breach check...
[SLAEscalation] Found X breached grievances
[SLAEscalation] Escalated grievance ... (Xh breach)
[SLAEscalation] Breach check completed
```

**Verification:**
- ✅ Job runs every hour
- ✅ Detects breached grievances
- ✅ Sends escalation notifications

---

### Test 2.4: Check Escalation History

**API Call:**
```bash
curl -X GET "http://localhost:5000/api/sla/grievance/GRIEVANCE_ID/escalations" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
[
  {
    "_id": "...",
    "grievance": "GRIEVANCE_ID",
    "breach_detected_at": "2024-03-20T10:00:00Z",
    "breach_hours": 24,
    "escalated_at": "2024-03-20T10:05:00Z",
    "escalation_status": "notified",
    "escalated_to_roles": ["Admin"],
    "notes": null
  }
]
```

**Verification:**
- ✅ Escalation history shows in chronological order
- ✅ breach_hours matches actual breach duration
- ✅ escalation_status is "notified"

---

### Test 2.5: Get Escalation Statistics

**API Call:**
```bash
curl -X GET "http://localhost:5000/api/sla/escalations/summary?start_date=2024-03-01&end_date=2024-03-31" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "total": 5,
  "pending": 0,
  "notified": 3,
  "resolved": 2,
  "average_breach_hours": 18.5
}
```

**Verification:**
- ✅ Counts match escalation history
- ✅ average_breach_hours is reasonable
- ✅ Status breakdown is accurate

---

### Test 2.6: List Currently Breached Grievances

**API Call:**
```bash
curl -X GET http://localhost:5000/api/sla/breached-grievances \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "count": 2,
  "grievances": [
    {
      "_id": "...",
      "grievance_id": "550e8400-...",
      "category": "Drainage",
      "severity_level": "High",
      "sla_due_date": "2024-03-19T10:00:00Z",
      "ward_id": "W001"
    }
  ]
}
```

**Verification:**
- ✅ Only non-resolved grievances shown
- ✅ SLA due date is in the past
- ✅ sla_breached_at is null (not yet escalated)

---

## Feature 3: Ward Performance Scorecards Testing

### Test 3.1: Generate Scorecard for a Ward

**API Call:**
```bash
curl -X GET "http://localhost:5000/api/dashboard/ward/W001/scorecard" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "ward_id": "W001",
  "generated_at": "2024-03-20T14:30:00Z",
  "summary": {
    "total_grievances": 15,
    "resolved": 12,
    "pending": 1,
    "in_progress": 2,
    "resolution_rate": 80.0,
    "avg_resolution_time_hours": 156.5,
    "avg_citizen_satisfaction": 4.2,
    "oldest_pending_days": 5
  },
  "sla_metrics": {
    "total": 15,
    "resolved": 12,
    "breached": 1,
    "on_track": 13,
    "at_risk": 1,
    "sla_compliance_rate": 93.33
  },
  "top_categories": [
    {
      "category": "Drainage",
      "total_complaints": 5,
      "resolved": 5,
      "resolution_rate": 100.0,
      "avg_citizen_rating": 4.5
    },
    {
      "category": "Water Supply",
      "total_complaints": 4,
      "resolved": 3,
      "resolution_rate": 75.0,
      "avg_citizen_rating": 3.8
    }
  ],
  "severity_distribution": [
    {
      "severity": "High",
      "total": 3,
      "resolved": 3,
      "percentage": 20.0
    },
    {
      "severity": "Medium",
      "total": 7,
      "resolved": 5,
      "percentage": 46.67
    },
    {
      "severity": "Low",
      "total": 5,
      "resolved": 4,
      "percentage": 33.33
    }
  ],
  "performance_grade": {
    "grade": "A",
    "label": "Excellent"
  }
}
```

**Verification Checklist:**
- ✅ Total grievances = sum of resolved + pending + in_progress
- ✅ Resolution rate = (resolved / total) * 100
- ✅ SLA compliance rate = ((total - breached) / total) * 100
- ✅ Top categories sorted by volume
- ✅ Severity percentages sum to 100
- ✅ Performance grade is calculated correctly:
  - A: Score ≥ 90
  - B: Score ≥ 80
  - C: Score ≥ 70
  - etc.

---

### Test 3.2: Get All Ward Scorecards

**API Call:**
```bash
curl -X GET http://localhost:5000/api/dashboard/wards/scorecards \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "total_wards": 3,
  "scorecards": [
    {
      "ward_id": "W001",
      "summary": { ... },
      "sla_metrics": { ... },
      "performance_grade": { "grade": "A", "label": "Excellent" }
    },
    {
      "ward_id": "W002",
      "summary": { ... },
      "performance_grade": { "grade": "B", "label": "Good" }
    },
    {
      "ward_id": "W003",
      "summary": { ... },
      "performance_grade": { "grade": "C", "label": "Satisfactory" }
    }
  ]
}
```

**Verification:**
- ✅ Scorecard for each ward with grievances
- ✅ All metrics calculated correctly
- ✅ total_wards matches unique ward_ids in database

---

### Test 3.3: Get Ward Comparison Analysis

**API Call:**
```bash
curl -X GET http://localhost:5000/api/dashboard/wards/comparison \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "total_wards": 3,
  "total_grievances": 45,
  "total_resolved": 38,
  "avg_resolution_rate": 84.33,
  "avg_sla_compliance": 91.67,
  "avg_citizen_satisfaction": 4.15,
  "top_performing_wards": [
    {
      "ward_id": "W001",
      "grade": "A",
      "resolution_rate": 90.0,
      "sla_compliance": 96.67
    },
    {
      "ward_id": "W002",
      "grade": "B",
      "resolution_rate": 85.0,
      "sla_compliance": 92.0
    }
  ],
  "bottom_performing_wards": [
    {
      "ward_id": "W003",
      "grade": "C",
      "resolution_rate": 72.0,
      "sla_compliance": 85.0
    }
  ]
}
```

**Verification:**
- ✅ System-wide averages calculated correctly
- ✅ Top 5 wards sorted by performance grade
- ✅ Bottom 5 wards identified
- ✅ total_resolved = sum of all ward resolves

---

### Test 3.4: Verify Scorecard Calculation Accuracy

**Manual Verification in MongoDB:**

```javascript
// Get grievances for ward W001
db.grievances_chennai_only.find({ ward_id: "W001" }).pretty()

// Count by status
db.grievances_chennai_only.countDocuments({ ward_id: "W001", status: "Resolved" })
db.grievances_chennai_only.countDocuments({ ward_id: "W001", status: "Pending" })
db.grievances_chennai_only.countDocuments({ ward_id: "W001", status: "In Progress" })

// Count by category
db.grievances_chennai_only.aggregate([
  { $match: { ward_id: "W001" } },
  { $group: { _id: "$category", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Average citizen satisfaction
db.grievances_chennai_only.aggregate([
  { $match: { ward_id: "W001", citizen_rating: { $ne: null } } },
  { $group: { _id: null, avg: { $avg: "$citizen_rating" } } }
])
```

**Cross-check:** API response metrics should match MongoDB counts exactly.

---

## Integration Testing

### Test 4.1: Full Workflow - Create → SLA Init → Monitor → Some Resolve

**Step 1: Create 5 Grievances**
```bash
# Create grievances with different severities
# High (24h SLA), Medium (72h SLA), Low (168h SLA)
```

**Step 2: Verify SLA Initialization**
```bash
# Check each grievance has sla_due_date
curl -X GET "http://localhost:5000/api/sla/grievance/GRIEVANCE_ID/status" 
# Should show "On Track" with hoursRemaining
```

**Step 3: Resolve Some Grievances**
```bash
curl -X PATCH "http://localhost:5000/api/grievances/GRIEVANCE_ID/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "Resolved" }'
```

**Step 4: Submit Citizen Feedback on Resolved Ones**
```bash
curl -X POST http://localhost:5000/api/public/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "grievance_id": "GRIEVANCE_ID",
    "rating": 5,
    "comment": "Issue resolved quickly and satisfactorily"
  }'
```

**Step 5: Check Ward Scorecard**
```bash
curl -X GET "http://localhost:5000/api/dashboard/ward/W001/scorecard" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Results:**
- ✅ Resolution rate increased (some resolved)
- ✅ Avg citizen satisfaction updated (from feedback)
- ✅ Average resolution time calculated
- ✅ Performance grade reflects new metrics

---

## Logging & Debugging

### Check Server Logs for Key Messages

**On Startup:**
```
✓ [SLAEngine] Default SLA rules initialized
✓ [SLAEscalation] Default escalation rules initialized
✓ [Scheduler] All cron jobs registered.
```

**When Creating Grievance:**
```
[SLAEngine] SLA initialized for grievance {ID}. Due: {DATE}
Triggering clustering...
```

**When Scheduler Runs (Every Hour):**
```
[Scheduler] Triggering SLA breach check job…
[SLAEscalation] Starting SLA breach check...
[SLAEscalation] Found X breached grievances
[SLAEscalation] Escalated grievance ... (XXh breach) under rule "..."
[Scheduler] SLA breach check completed. Found X breached grievances.
```

**When Email Sent:**
```
[SLAEscalation] Failed to send email to admin@example.com: ...
// (email service disabled if SMTP not configured, but escalation still records)
```

---

## Troubleshooting Common Issues

### Issue 1: "SLA rules not found when creating grievance"
**Solution:**
- Check that `initializeDefaultSLARules()` ran on startup
- Manually run: `db.slarules.insertMany([...])` with default rules

### Issue 2: "Escalation job not running"
**Solution:**
- Verify scheduler started: check server logs
- Check cron expression: `"0 * * * *"` runs every hour
- Manually test: database update for old grievance + server restart

### Issue 3: "Email not being sent"
**Solution:**
- SMTP not required for escalation to work (creates history entry anyway)
- Check `.env` for SMTP_HOST, SMTP_USER, SMTP_PASS
- Use `sendGrievanceAcknowledgement()` separately to test SMTP

### Issue 4: "Ward scorecard returns 0 metrics"
**Solution:**
- Verify grievances exist for the ward
- Check ward_id spelling matches exactly
- Run MongoDB count: `db.grievances_chennai_only.countDocuments({ ward_id: "W001" })`

### Issue 5: "Performance grade always F"
**Solution:**
- Check that citizen_rating is being set on resolved grievances
- Verify resolution_rate > 0 (at least some resolved)
- Check SLA compliance rate is calculated
- Grade formula: 40% resolution + 40% SLA + 20% satisfaction

---

## Complete Test Checklist

### SLA Engine ✓
- [ ] Default SLA rules created on startup
- [ ] Grievance gets sla_due_date on creation
- [ ] sla_status is "On Track" initially
- [ ] Custom SLA rules can be created
- [ ] Correct response hours applied by severity
- [ ] Can retrieve SLA status via API
- [ ] Database has sla_* fields

### Auto-Escalation ✓
- [ ] Default escalation rules created on startup
- [ ] Scheduler runs every hour (check logs)
- [ ] Breached grievances detected correctly
- [ ] Escalation history created
- [ ] Escalated_at timestamp recorded
- [ ] Custom escalation rules can be created
- [ ] Breach hours calculated correctly
- [ ] Email notifications sent (if SMTP configured)

### Ward Scorecards ✓
- [ ] Scorecard endpoint returns valid response
- [ ] Total grievances counts correct
- [ ] Resolution rate calculated accurately
- [ ] SLA compliance rate accurate
- [ ] Top categories ranked by volume
- [ ] Severity distribution percentages sum to 100
- [ ] Average citizen satisfaction from ratings
- [ ] Performance grade A-F assigned correctly
- [ ] Comparison endpoint shows system-wide metrics
- [ ] Top/bottom wards ranked by grade

---

## Performance Notes

- Scorecard generation should complete in < 2 seconds for 20k+ grievances
- Escalation job runs once per hour, takes < 30 seconds
- Database indexes on `sla_due_date`, `sla_status` optimize queries
- Aggregation pipelines in scorecard service are indexed

If any test fails, check the server logs first for error messages.
