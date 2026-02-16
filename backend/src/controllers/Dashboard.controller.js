// Controlador de metricas para panel visual y comparativas.
import {
  getComparison,
  getExpenseByCategory,
  getMonthlyExpense,
  getTrend
} from "../services/Dashboard.service.js";
import { logger } from "../utils/logger.js";

export const getByCategory = async (req, res, next) => {
  try {
    logger.info("[Dashboard] Calculando gasto por categoria");
    const data = await getExpenseByCategory(req.query);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const getMonthly = async (req, res, next) => {
  try {
    logger.info("[Dashboard] Calculando gasto mensual");
    const data = await getMonthlyExpense(req.query);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const getTrendData = async (req, res, next) => {
  try {
    logger.info("[Dashboard] Calculando tendencia");
    const data = await getTrend(req.query);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

export const getComparisonData = async (req, res, next) => {
  try {
    const granularity = req.query.granularity || "month";
    logger.info(`[Dashboard] Calculando comparativa por ${granularity}`);
    const data = await getComparison(req.query, granularity);
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};
