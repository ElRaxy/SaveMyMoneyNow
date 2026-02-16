// Controlador CRUD de reglas de categorizacion.
import { createRule, deleteRule, listRules, updateRule } from "../services/Rule.service.js";
import { logger } from "../utils/logger.js";

export const getRules = async (req, res, next) => {
  try {
    logger.info("[Reglas] Consultando reglas de categorizacion");
    const rules = await listRules();
    return res.json(rules);
  } catch (error) {
    return next(error);
  }
};

export const postRule = async (req, res, next) => {
  try {
    logger.info("[Reglas] Creando regla nueva");
    const rule = await createRule(req.body || {});
    return res.status(201).json(rule);
  } catch (error) {
    return next(error);
  }
};

export const putRule = async (req, res, next) => {
  try {
    logger.info(`[Reglas] Actualizando regla ${req.params.id}`);
    const rule = await updateRule(req.params.id, req.body || {});
    if (!rule) {
      return res.status(404).json({ message: "Regla no encontrada" });
    }
    return res.json(rule);
  } catch (error) {
    return next(error);
  }
};

export const removeRule = async (req, res, next) => {
  try {
    logger.info(`[Reglas] Eliminando regla ${req.params.id}`);
    await deleteRule(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
