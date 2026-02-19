import { body } from "express-validator";

export const registerValidator = [
  body("name").notEmpty().withMessage("Name required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .optional()
    .isIn(["Citizen", "Admin", "FieldWorker"])
    .withMessage("Invalid role"),
  body("phone")
    .optional()
    .isString(),
  body("assignedDistrict")
    .optional()
    .isString()
];

export const loginValidator = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required")
];
