// Helper de arranque de Express para integracion.
//
// Reutilizamos la `app` real (backend/src/app.js) pero la envolvemos con
// supertest para hacer requests sin abrir puerto. Esto permite probar
// rutas, middlewares de validacion y handlers exactamente como se
// ejecutarian en produccion.
//
// Importante: el import de app.js debe ocurrir DESPUES de que setup.js haya
// puesto MONGODB_URI (env.js valida en import-time). El setup global de
// Vitest se ejecuta antes que cualquier suite, asi que aqui basta con un
// import normal.
import request from "supertest";
import app from "../../src/app.js";

export const buildAgent = () => request(app);

export { app };
