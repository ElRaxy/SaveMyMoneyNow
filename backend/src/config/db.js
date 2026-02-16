// Conexion centralizada con MongoDB.
import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const connectDB = async (uri) => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  logger.success("[Base de datos] Conexion con MongoDB establecida");
};
