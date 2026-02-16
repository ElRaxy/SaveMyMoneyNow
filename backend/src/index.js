// Punto de arranque del backend: conecta BBDD y levanta servidor HTTP.
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const bootstrap = async () => {
  try {
    await connectDB(env.mongoUri);
    app.listen(env.port, () => {
      logger.success(`[Servidor] Backend escuchando en http://localhost:${env.port}`);
    });
  } catch (error) {
    logger.error("[Servidor] Error al iniciar el backend:", error);
    process.exit(1);
  }
};

bootstrap();
