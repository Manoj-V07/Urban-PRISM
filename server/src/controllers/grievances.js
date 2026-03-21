import Grievance from "../models/grievance.js";
import { processGrievance } from "../services/clusteringService.js";
import {
  sendGrievanceAcknowledgement,
  sendGrievanceStatusUpdate
} from "../services/emailService.js";
import { analyzeComplaint } from "../services/aiService.js";
import { verifyComplaintImage } from "../services/aiService.js";
import { initializeSLAForGrievance } from "../services/slaEngineService.js";

const DUPLICATE_SEARCH_DISTANCE_METERS = 600;
const DUPLICATE_LOOKBACK_DAYS = 45;

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "if", "then", "is", "are", "was", "were", "to", "of", "in", "on", "at", "for", "with", "this", "that", "it", "be", "by", "from", "as", "my", "our", "your"
]);

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value) {
  const words = normalizeText(value).split(" ").filter(Boolean);
  return words.filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function jaccardSimilarity(textA, textB) {
  const setA = new Set(tokenize(textA));
  const setB = new Set(tokenize(textB));

  if (!setA.size || !setB.size) {
    return 0;
  }

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRadians = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function normalizeImagePath(filePath) {
  if (!filePath) {
    return null;
  }

  const normalized = String(filePath).replace(/\\/g, "/");
  const uploadsIndex = normalized.toLowerCase().lastIndexOf("/uploads/");

  if (uploadsIndex !== -1) {
    return normalized.slice(uploadsIndex + 1);
  }

  return normalized.replace(/^\/+/, "");
}

// Submit grievance
export const createGrievance = async (req, res, next) => {
  try {

    const {
      category,
      latitude,
      longitude,
      district_name,
      ward_id,
      complaint_text,
      severity_level,
    } = req.body;

    if (!req.file)
      return res.status(400).json({ message: "Image required" });

    if (!latitude || !longitude)
      return res.status(400).json({ message: "Location required" });


    // ---------------- AI ANALYSIS ----------------
    let aiResult = null;

    try {
      aiResult = await analyzeComplaint(complaint_text);
    } catch (err) {
      console.error("AI Analysis Failed:", err.message);
    }
    // ---------------------------------------------

    const finalCategory = aiResult?.category || category;
    const finalSeverity = aiResult?.severity || severity_level;

    if (!finalCategory || !finalSeverity) {
      return res.status(400).json({
        message: "AI analysis failed and no manual category/severity provided",
      });
    }

    // Verify image vs text
    const check = await verifyComplaintImage(
      req.file.path,
      complaint_text
    );

    if (!check.match) {
      return res.status(400).json({
        success: false,
        message: "Image does not match complaint",
        reason: check.reason
      });
    }

    const grievance = await Grievance.create({

      grievance_id: crypto.randomUUID(),

      category: finalCategory,

      location: {
        type: "Point",
        coordinates: [
          parseFloat(longitude),
          parseFloat(latitude)
        ]
      },

      district_name,
      ward_id,

      complaint_text,

      // Store AI summary (optional field)
      summary: aiResult?.summary || null,

      complaint_date: new Date(),

      severity_level: finalSeverity,

      status: "Pending",

      complaint_volume: 1,

      image_url: normalizeImagePath(req.file.path),

      createdBy: req.user._id
    });

    // Initialize SLA for the grievance
    try {
      await initializeSLAForGrievance(
        grievance._id,
        grievance.complaint_date,
        grievance.severity_level,
        grievance.category
      );
    } catch (slaErr) {
      console.error("SLA initialization failed:", slaErr.message);
      // Non-critical, don't fail the request
    }

    console.log("Triggering clustering...");
    await processGrievance(grievance);
    console.log("Clustering done");

    try {
      await sendGrievanceAcknowledgement({
        to: req.user.email,
        name: req.user.name || "Citizen",
        grievanceId: grievance.grievance_id,
        category: grievance.category,
        severity: grievance.severity_level,
        status: grievance.status,
        districtName: grievance.district_name,
        wardId: grievance.ward_id,
        complaintDate: grievance.complaint_date
      });
    } catch (mailErr) {
      console.error("Acknowledgement email failed:", mailErr.message);
    }

    res.status(201).json(grievance);

  } catch (err) {
    // Send failure email
    try {
      if (req.user && req.user.email) {
        await sendEmail(
          req.user.email,
          "Grievance Registration Failed",
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f44336;">✗ Grievance Registration Failed</h2>
            <p>Dear ${req.user.name},</p>
            <p>Unfortunately, we encountered an error while processing your complaint.</p>
            
            <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
              <p><strong>Error:</strong> ${err.message || 'Unknown error occurred'}</p>
            </div>
            
            <p>Please try submitting your complaint again. If the problem persists, contact our support team.</p>
            
            <p><strong>Tips for successful submission:</strong></p>
            <ul>
              <li>Ensure you've uploaded a clear image</li>
              <li>Provide accurate location details</li>
              <li>Write a detailed description of the issue</li>
            </ul>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">This is an automated email from Urban-PRISM. Please do not reply to this email.</p>
          </div>
          `
        );
        console.log("Failure email sent to:", req.user.email);
      }
    } catch (mailErr) {
      console.error("Failed to send failure email:", mailErr.message);
    }
    next(err);
  }
};


// Citizen history / Admin view all
export const getMyGrievances = async (req, res, next) => {
  try {
    const filter = req.user.role === "Admin" ? {} : { createdBy: req.user._id };
    const grievances = await Grievance.find(filter).sort({ complaint_date: -1 });

    res.json(grievances);
  } catch (err) {
    next(err);
  }
};

// Admin status update
export const updateStatus = async (req, res, next) => {

  try {
    const nextStatus = req.body.status;
    const allowedStatuses = ["Pending", "In Progress", "Resolved"];

    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const grievance = await Grievance
      .findById(req.params.id)
      .populate("createdBy");

    if (!grievance)
      return res.status(404).json({ message: "Not found" });

    if (grievance.status === nextStatus)
      return res.json(grievance);

    grievance.status = nextStatus;

    await grievance.save();

    // Try sending email (non-blocking)
    try {

      await sendGrievanceStatusUpdate({
        to: grievance.createdBy.email,
        name: grievance.createdBy.name || "Citizen",
        grievanceId: grievance.grievance_id,
        status: grievance.status
      });

      console.log("Status update email sent to:", grievance.createdBy.email);

    } catch (mailErr) {

      console.error("Email failed:", mailErr.message);
      console.error("Email error details:", mailErr);
      // Optional: log to DB later
    }

    // Always respond success
    res.json(grievance);

  } catch (err) {
    next(err);
  }
};

// Citizen duplicate pre-check before final create
export const checkPossibleDuplicates = async (req, res, next) => {
  try {
    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const {
      complaint_text,
      latitude,
      longitude,
      ward_id,
      district_name,
    } = payload;

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (!complaint_text || Number.isNaN(lat) || Number.isNaN(lon) || !ward_id || !district_name) {
      return res.status(400).json({
        message: "complaint_text, latitude, longitude, ward_id and district_name are required",
      });
    }

    const districtRegex = new RegExp(`^${String(district_name).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const since = new Date(Date.now() - DUPLICATE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    const nearby = await Grievance.find({
      ward_id,
      district_name: districtRegex,
      status: { $ne: "Resolved" },
      complaint_date: { $gte: since },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          $maxDistance: DUPLICATE_SEARCH_DISTANCE_METERS,
        },
      },
    })
      .sort({ complaint_date: -1 })
      .limit(5)
      .lean();

    const possibleDuplicates = nearby
      .map((item) => {
        const otherLat = item?.location?.coordinates?.[1];
        const otherLon = item?.location?.coordinates?.[0];
        const distanceMeters =
          typeof otherLat === "number" && typeof otherLon === "number"
            ? getDistanceMeters(lat, lon, otherLat, otherLon)
            : null;

        const similarity = jaccardSimilarity(complaint_text, item.complaint_text);

        return {
          _id: item._id,
          grievance_id: item.grievance_id,
          status: item.status,
          category: item.category,
          district_name: item.district_name,
          ward_id: item.ward_id,
          complaint_text: item.complaint_text,
          complaint_date: item.complaint_date,
          similarity: Number(similarity.toFixed(2)),
          distanceMeters,
        };
      })
      .filter((item) => {
        const nearEnough = item.distanceMeters === null || item.distanceMeters <= 450;
        const textSimilar = item.similarity >= 0.18;
        return nearEnough && textSimilar;
      })
      .sort((a, b) => {
        if (b.similarity !== a.similarity) {
          return b.similarity - a.similarity;
        }
        return (a.distanceMeters || Number.MAX_SAFE_INTEGER) - (b.distanceMeters || Number.MAX_SAFE_INTEGER);
      });

    res.json({
      warning: possibleDuplicates.length > 0,
      possibleDuplicates,
      threshold: {
        similarity: 0.18,
        maxDistanceMeters: 450,
        lookbackDays: DUPLICATE_LOOKBACK_DAYS,
      },
    });
  } catch (err) {
    next(err);
  }
};