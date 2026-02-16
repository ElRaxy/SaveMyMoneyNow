// Archivo: backend\src\routes\dashboard.routes.js. Codigo y comentarios en espanol.
import { Router } from "express";
import {
  getByCategory,
  getComparisonData,
  getMonthly,
  getTrendData
} from "../controllers/Dashboard.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { validateGranularityQuery } from "../validators/filterValidators.js";

const router = Router();

router.get("/by-category", getByCategory);
router.get("/monthly-expense", getMonthly);
router.get("/trend", getTrendData);
router.get("/comparison", validateRequest(validateGranularityQuery), getComparisonData);

export default router;
