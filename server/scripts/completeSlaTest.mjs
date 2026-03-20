import dotenv from "dotenv";
import mongoose from "mongoose";
import { checkAndEscalateSLABreaches } from "../src/services/slaEscalationService.js";

dotenv.config({ path: "./.env", quiet: true });

const base = "http://localhost:5000/api";
const results = [];

const pass = (name, details = "") => results.push({ name, status: "PASS", details });
const fail = (name, details = "") => results.push({ name, status: "FAIL", details });
const info = (name, details = "") => results.push({ name, status: "INFO", details });

const run = async () => {
  // 1) Health
  try {
    const health = await fetch(`${base}/health`);
    if (health.status === 200) {
      pass("Server health", "/api/health=200");
    } else {
      fail("Server health", `status=${health.status}`);
    }
  } catch (error) {
    fail("Server health", error.message);
  }

  // 2) Admin token
  let adminToken = "";
  const ts = Date.now();
  const adminEmail = `sla.test.admin.${ts}@example.com`;

  try {
    const reg = await fetch(`${base}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "SLA Test Admin",
        email: adminEmail,
        password: "Pass@12345",
        role: "Admin"
      })
    });

    const regBodyText = await reg.text();
    if (reg.status === 201) {
      adminToken = JSON.parse(regBodyText).token;
      pass("Admin auth", "registered temp admin");
    } else {
      const login = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: "Pass@12345" })
      });

      const loginBodyText = await login.text();
      if (login.status === 200) {
        adminToken = JSON.parse(loginBodyText).token;
        pass("Admin auth", "logged in temp admin");
      } else {
        fail("Admin auth", `register=${reg.status}, login=${login.status}`);
      }
    }
  } catch (error) {
    fail("Admin auth", error.message);
  }

  if (!adminToken) {
    console.log(JSON.stringify({ summary: { pass: 0, fail: 1, info: 0 }, results }, null, 2));
    return;
  }

  const headers = { Authorization: `Bearer ${adminToken}` };

  // 3) SLA APIs
  try {
    const r = await fetch(`${base}/sla/rules`, { headers });
    const body = await r.json();
    if (r.status === 200 && Array.isArray(body) && body.length >= 3) {
      pass("SLA rules API", `count=${body.length}`);
    } else {
      fail("SLA rules API", `status=${r.status}`);
    }
  } catch (error) {
    fail("SLA rules API", error.message);
  }

  try {
    const r = await fetch(`${base}/sla/escalation-rules`, { headers });
    const body = await r.json();
    if (r.status === 200 && Array.isArray(body) && body.length >= 3) {
      pass("Escalation rules API", `count=${body.length}`);
    } else {
      fail("Escalation rules API", `status=${r.status}`);
    }
  } catch (error) {
    fail("Escalation rules API", error.message);
  }

  // 4) DB + breach simulation
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const grievances = db.collection("grievances_chennai_only");
  const slas = db.collection("slas");
  const tracks = db.collection("slatrackings");
  const escalationHistories = db.collection("escalationhistories");

  const sample = await grievances.findOne(
    { sla_due_date: { $ne: null }, status: { $ne: "Resolved" } },
    {
      projection: {
        _id: 1,
        grievance_id: 1,
        ward_id: 1,
        sla_due_date: 1,
        sla_status: 1,
        severity_level: 1,
        category: 1
      }
    }
  );

  if (!sample) {
    fail("Sample grievance", "No non-resolved grievance with SLA found");
    await mongoose.disconnect();
    const summary = {
      pass: results.filter((x) => x.status === "PASS").length,
      fail: results.filter((x) => x.status === "FAIL").length,
      info: results.filter((x) => x.status === "INFO").length
    };
    console.log(JSON.stringify({ summary, results }, null, 2));
    return;
  }

  pass("Sample grievance", `id=${sample.grievance_id}, ward=${sample.ward_id}`);

  const beforeTrackCount = await tracks.countDocuments({ grievance: sample._id });
  const beforeEscCount = await escalationHistories.countDocuments({ grievance: sample._id });

  const forcedDue = new Date(Date.now() - 4 * 60 * 60 * 1000);
  await grievances.updateOne(
    { _id: sample._id },
    {
      $set: {
        sla_due_date: forcedDue,
        sla_status: "On Track",
        sla_breached_at: null,
        sla_escalated_at: null,
        status: "Pending"
      }
    }
  );
  info("Forced breach setup", "set due_date 4h in past");

  // 5) Manual SLA status update API
  try {
    const r = await fetch(`${base}/sla/grievance/${sample._id.toString()}/update-status`, {
      method: "POST",
      headers
    });
    const bodyText = await r.text();
    if (r.status === 200) {
      pass("Manual SLA status update API", "status=200");
    } else {
      fail("Manual SLA status update API", `status=${r.status}, body=${bodyText}`);
    }
  } catch (error) {
    fail("Manual SLA status update API", error.message);
  }

  // 6) Verify grievance + slas + slatrackings writes
  const updatedGrievance = await grievances.findOne(
    { _id: sample._id },
    { projection: { sla_status: 1, sla_breached_at: 1, sla_due_date: 1 } }
  );

  if (updatedGrievance?.sla_status === "Breached" && updatedGrievance?.sla_breached_at) {
    pass("Grievance SLA breach persisted", "status=Breached");
  } else {
    fail("Grievance SLA breach persisted", JSON.stringify(updatedGrievance));
  }

  const slaDoc = await slas.findOne({ grievance: sample._id });
  if (slaDoc && slaDoc.status === "Breached") {
    pass("slas collection sync", "status=Breached");
  } else {
    fail("slas collection sync", JSON.stringify(slaDoc));
  }

  const afterTrackCount = await tracks.countDocuments({ grievance: sample._id });
  if (afterTrackCount > beforeTrackCount) {
    pass("slatrackings write", `events added=${afterTrackCount - beforeTrackCount}`);
  } else {
    fail("slatrackings write", "no new events");
  }

  // 7) Escalation execution
  try {
    const processed = await checkAndEscalateSLABreaches();
    pass("Escalation service execution", `processed=${processed}`);
  } catch (error) {
    fail("Escalation service execution", error.message);
  }

  const afterEscCount = await escalationHistories.countDocuments({ grievance: sample._id });
  if (afterEscCount > beforeEscCount) {
    pass("Escalation history write", `entries added=${afterEscCount - beforeEscCount}`);
  } else {
    info("Escalation history write", "no new row for sample (rule conditions or already escalated)");
  }

  // 8) Escalation summary API
  try {
    const r = await fetch(`${base}/sla/escalations/summary`, { headers });
    const body = await r.json();
    if (r.status === 200 && typeof body.total === "number") {
      pass("Escalation summary API", `total=${body.total}`);
    } else {
      fail("Escalation summary API", `status=${r.status}`);
    }
  } catch (error) {
    fail("Escalation summary API", error.message);
  }

  // 9) Ward scorecard API
  try {
    const r = await fetch(`${base}/dashboard/ward/${sample.ward_id}/scorecard`, { headers });
    const body = await r.json();
    if (r.status === 200 && body?.ward_id === sample.ward_id && body?.sla_metrics) {
      pass("Ward scorecard API", `ward=${body.ward_id}, compliance=${body.sla_metrics.sla_compliance_rate}`);
    } else {
      fail("Ward scorecard API", `status=${r.status}`);
    }
  } catch (error) {
    fail("Ward scorecard API", error.message);
  }

  await mongoose.disconnect();

  const summary = {
    pass: results.filter((x) => x.status === "PASS").length,
    fail: results.filter((x) => x.status === "FAIL").length,
    info: results.filter((x) => x.status === "INFO").length
  };

  console.log(JSON.stringify({ summary, results }, null, 2));
};

run().catch(async (error) => {
  console.error("COMPLETE_SLA_TEST_FAILED", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
