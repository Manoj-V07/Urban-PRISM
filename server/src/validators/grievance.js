import { body } from "express-validator";

export const grievanceValidator = [

  body("district_name")
    .notEmpty()
    .withMessage("District required"),

  body("ward_id")
    .notEmpty()
    .withMessage("Ward required"),

  body("complaint_text")
    .notEmpty()
    .withMessage("Complaint text required"),

  // OPTIONAL: AI can fill these
  body("category")
    .optional()
    .notEmpty(),

  body("severity_level")
    .optional()
    .isIn(["Low", "Medium", "High"])
];
