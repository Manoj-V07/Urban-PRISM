import { body } from "express-validator";

export const userUpdateValidator = [
  body("name").optional().notEmpty(),
  body("email").optional().isEmail()
];
