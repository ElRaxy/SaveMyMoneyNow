// Archivo: backend\src\models\Movement.model.js. Codigo y comentarios en espanol.
import mongoose from "mongoose";

const movementSchema = new mongoose.Schema(
  {
    fecha: { type: Date, required: true, index: true },
    concepto: { type: String, required: true, trim: true, index: true },
    importe: { type: Number, required: true },
    origen: {
      type: String,
      enum: ["tarjeta", "cuenta", "otro"],
      default: "otro",
      index: true
    },
    archivo: { type: String, required: true },
    categoria: { type: String, required: true, default: "Otros", index: true },
    fingerprintKey: { type: String, required: true, index: true },
    exactKey: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

movementSchema.index({ fecha: 1, concepto: 1 });

export default mongoose.model("Movement", movementSchema);
