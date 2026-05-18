// Configuracion de Vitest para la suite de tests del backend.
//
// - globals: permite usar describe/it/expect sin imports explicitos.
// - environment: "node" porque no hay DOM; solo Node + Mongoose.
// - testTimeout: 30s. mongodb-memory-server descarga el binario la primera
//   vez (50-100 MB) y luego arranca un mongod en proceso; necesitamos
//   margen para CI / primera ejecucion en local.
// - hookTimeout: igual que testTimeout para beforeAll que descarga mongo.
// - setupFiles: configura MONGODB_URI antes de cualquier import de la app
//   (env.js valida la variable al cargar).
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 60000,
    setupFiles: ["./tests/setup.js"],
    pool: "forks"
  }
});
