import { body } from "express-validator";

export const assetValidator = [
  body("name").notEmpty(),
  body("category").notEmpty(),
  body("district_name").notEmpty(),
  body("ward_id").notEmpty()
];
