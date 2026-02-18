import Grievance from "../models/grievance.js";
import { processGrievance } from "../services/clusteringService.js";
import { sendEmail } from "../services/emailService.js";
import { analyzeComplaint } from "../services/aiService.js";
import { verifyComplaintImage } from "../services/aiService.js";

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

      image_url: req.file.path,

      createdBy: req.user._id
    });


    console.log("Triggering clustering...");
    await processGrievance(grievance);
    console.log("Clustering done");

    // Send success email
    try {
      await sendEmail(
        req.user.email,
        "Grievance Registered Successfully",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">✓ Grievance Registered Successfully</h2>
          <p>Dear ${req.user.name},</p>
          <p>Your complaint has been successfully registered in our system.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Complaint Details:</h3>
            <p><strong>Grievance ID:</strong> ${grievance.grievance_id}</p>
            <p><strong>Category:</strong> ${grievance.category}</p>
            <p><strong>Severity:</strong> ${grievance.severity_level}</p>
            <p><strong>Status:</strong> ${grievance.status}</p>
            <p><strong>Location:</strong> ${district_name}, Ward ${ward_id}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          
          <p><strong>Your Complaint:</strong></p>
          <p style="background-color: #f9f9f9; padding: 10px; border-left: 3px solid #4CAF50;">${complaint_text}</p>
          
          ${aiResult?.summary ? `<p><strong>AI Summary:</strong> ${aiResult.summary}</p>` : ''}
          
          <p>We will review your complaint and update you on the progress.</p>
          <p>Thank you for helping us improve our city!</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from Urban-PRISM. Please do not reply to this email.</p>
        </div>
        `
      );
      console.log("Registration email sent to:", req.user.email);
    } catch (mailErr) {
      console.error("Failed to send registration email:", mailErr.message);
      // Don't block the response if email fails
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

    const grievance = await Grievance
      .findById(req.params.id)
      .populate("createdBy");

    if (!grievance)
      return res.status(404).json({ message: "Not found" });

    if (!grievance.createdBy) {
      console.error("Grievance has no associated user");
      return res.status(400).json({ message: "Invalid grievance data" });
    }

    const oldStatus = grievance.status;
    grievance.status = req.body.status;

    await grievance.save();

    // Try sending email (non-blocking)
    try {

      await sendEmail(
        grievance.createdBy.email,
        "Grievance Status Updated",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2196F3;">📢 Grievance Status Updated</h2>
          <p>Dear ${grievance.createdBy.name},</p>
          <p>The status of your complaint has been updated.</p>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Complaint Details:</h3>
            <p><strong>Grievance ID:</strong> ${grievance.grievance_id}</p>
            <p><strong>Category:</strong> ${grievance.category}</p>
            <p><strong>Previous Status:</strong> <span style="color: #666;">${oldStatus}</span></p>
            <p><strong>Current Status:</strong> <span style="color: #4CAF50; font-weight: bold;">${grievance.status}</span></p>
            <p><strong>Updated On:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p><strong>Your Complaint:</strong></p>
          <p style="background-color: #f9f9f9; padding: 10px; border-left: 3px solid #2196F3;">${grievance.complaint_text}</p>
          
          ${grievance.status === 'Resolved' ? 
            '<div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;"><p style="color: #2e7d32; font-weight: bold;">✓ Your complaint has been resolved! Thank you for your patience.</p></div>' : 
            '<p>We are working on resolving your complaint. You will be notified of any further updates.</p>'
          }
          
          <p>Thank you for your cooperation!</p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This is an automated email from Urban-PRISM. Please do not reply to this email.</p>
        </div>
        `
      );

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