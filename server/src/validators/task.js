import { body } from "express-validator";

export const assignTaskValidator = [
  body("grievanceId")
    .notEmpty()
    .withMessage("Grievance ID required")
    .isMongoId()
    .withMessage("Invalid grievance ID"),

  body("workerId")
    .notEmpty()
    .withMessage("Worker ID required")
    .isMongoId()
    .withMessage("Invalid worker ID"),

  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),

  body("notes")
    .optional()
    .isString()
];

export const proofSubmitValidator = [
  body("workerNotes")
    .optional()
    .isString()
];

export const reviewValidator = [
  body("reviewNotes")
    .optional()
    .isString()
];

export const verifyWorkerValidator = [
  body("assignedDistrict")
    .optional()
    .isString()
    .withMessage("District must be a string")
];
