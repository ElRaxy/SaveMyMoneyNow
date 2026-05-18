// Controlador de consulta y edicion de movimientos persistidos.
import {
  listMovements,
  updateMovementById,
  deleteMovementById
} from "../services/Movement.service.js";
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

export const updateMovement = async (req, res, next) => {
  try {
    logger.info(`[Movimientos] Actualizando movimiento ${req.params.id}`);
    const updated = await updateMovementById(req.params.id, req.body || {});
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
};

// Devuelve 204 sin body porque la semantica REST de DELETE indica que la
// operacion ha tenido exito pero no hay representacion nueva que enviar.
// Asi el cliente no necesita parsear nada y queda claro que el recurso ya
// no existe. Si el id no existe el servicio lanza un error 404 que captura
// el middleware de errores.
export const deleteMovement = async (req, res, next) => {
  try {
    logger.info(`[Movimientos] Eliminando movimiento ${req.params.id}`);
    await deleteMovementById(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
