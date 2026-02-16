// Configuracion principal de Express y registro de rutas de la API.
import cors from "cors";
import express from "express";
import importRoutes from "./routes/import.routes.js";
import movementRoutes from "./routes/movement.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import ruleRoutes from "./routes/rule.routes.js";
import exportRoutes from "./routes/export.routes.js";
import { errorHandler, notFound } from "./middlewares/errorMiddleware.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const app = express();
let requestCounter = 0;

// Log global por peticion para facilitar depuracion y trazabilidad.
app.use((req, res, next) => {
  requestCounter += 1;
  const requestId = requestCounter;
  req.requestId = requestId;
  res.setHeader("X-Request-Id", String(requestId));

  const inicio = Date.now();
  res.on("finish", () => {
    const duracionMs = Date.now() - inicio;
    logger.http({
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duracionMs
    });
  });
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Sin cabecera Origin (curl, Postman, server-to-server) se permite.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origen no permitido por CORS: ${origin}`));
    }
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/import", importRoutes);
app.use("/api/movements", movementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rules", ruleRoutes);
app.use("/api/export", exportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
