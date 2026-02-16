// Controlador de consulta de movimientos persistidos.
import { listMovements } from "../services/Movement.service.js";
import { logger } from "../utils/logger.js";

export const getMovements = async (req, res, next) => {
  try {
    logger.info("[Movimientos] Listando movimientos con filtros", req.query || {});
    const result = await listMovements(req.query, {
      page: req.query.page,
      limit: req.query.limit
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};
