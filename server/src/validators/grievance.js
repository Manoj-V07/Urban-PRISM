import { body } from "express-validator";

export const grievanceValidator = [
  body("category").notEmpty(),
  body("district_name").notEmpty(),
  body("ward_id").notEmpty(),
  body("complaint_text").notEmpty(),
  body("severity_level").isIn(["Low", "Medium", "High"])
];
