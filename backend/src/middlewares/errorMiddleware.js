// Manejo uniforme de errores y rutas inexistentes.
import { logger } from "../utils/logger.js";

export const notFound = (req, res, next) => {
  res.status(404).json({ message: "Ruta no encontrada" });
};

export const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || "Error interno del servidor";
  const context = {
    requestId: req.requestId || null,
    method: req.method,
    path: req.originalUrl,
    status
  };

  if (status >= 500) {
    logger.error(`[Error ${status}] ${message}`, context, error);
  } else {
    logger.warn(`[Error ${status}] ${message}`, context);
  }

  res.status(status).json({ message });
};
