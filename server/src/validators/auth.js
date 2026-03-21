import { body } from "express-validator";

export const registerValidator = [
  body("name").notEmpty().withMessage("Name required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("phone")
    .optional({ values: "falsy" })
    .matches(/^[+]?\d{8,15}$/)
    .withMessage("Phone must be 8-15 digits and may start with +"),
  body("whatsappNumber")
    .optional({ values: "falsy" })
    .matches(/^[+]?\d{8,15}$/)
    .withMessage("WhatsApp number must be 8-15 digits and may start with +"),
  body("mobile")
    .optional({ values: "falsy" })
    .matches(/^[+]?\d{8,15}$/)
    .withMessage("Mobile number must be 8-15 digits and may start with +"),
  body("mobileNumber")
    .optional({ values: "falsy" })
    .matches(/^[+]?\d{8,15}$/)
    .withMessage("Mobile number must be 8-15 digits and may start with +"),
  body("role")
    .optional()
    .isIn(["Citizen", "Admin", "FieldWorker"])
    .withMessage("Invalid role"),
  body("workerCategory")
    .if(body("role").equals("FieldWorker"))
    .notEmpty()
    .withMessage("Worker category required")
    .isIn(["Electrician", "Plumber", "Road Maintenance", "Drainage Worker", "Sanitation Worker"])
    .withMessage("Invalid worker category")
];

export const loginValidator = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password required")
];
