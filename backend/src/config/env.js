// Carga y validacion de variables de entorno.
import dotenv from "dotenv";

dotenv.config();

const origenesPorDefecto = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5180",
  "http://127.0.0.1:5180"
];
const origenesDesdeEnv = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);

const origenesCors = [...new Set([...origenesPorDefecto, ...origenesDesdeEnv])];

export const env = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || "",
  corsOrigins: origenesCors
};

if (!env.mongoUri) {
  throw new Error("Falta MONGODB_URI. Configuralo en backend/.env");
}
