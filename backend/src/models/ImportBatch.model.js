// Archivo: backend\src\models\ImportBatch.model.js. Codigo y comentarios en espanol.
import mongoose from "mongoose";

const importBatchSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["uploaded", "detected", "mapped", "categorized", "duplicates_checked", "committed"],
      default: "uploaded"
    },
    files: [
      {
        fileId: { type: String, required: true },
        originalName: { type: String, required: true },
        storedName: { type: String, required: true },
        filePath: { type: String, required: true },
        mimeType: { type: String },
        size: { type: Number }
      }
    ],
    detections: [
      {
        fileId: String,
        headerRowDetected: Number,
        headers: [String],
        possibleColumns: {
          fecha: String,
          concepto: String,
          importe: String,
          saldo: String
        },
        previewRows: [mongoose.Schema.Types.Mixed]
      }
    ],
    mappings: [
      {
        fileId: String,
        headerRow: Number,
        mapping: {
          fecha: String,
          concepto: String,
          importe: String
        },
        origen: {
          type: String,
          enum: ["tarjeta", "cuenta", "otro"],
          default: "otro"
        }
      }
    ],
    normalizedRows: [mongoose.Schema.Types.Mixed],
    invalidRows: [mongoose.Schema.Types.Mixed],
    categorizedRows: [mongoose.Schema.Types.Mixed],
    duplicateRows: [mongoose.Schema.Types.Mixed],
    conflictRows: [mongoose.Schema.Types.Mixed],
    nonConflictRows: [mongoose.Schema.Types.Mixed],
    commitSummary: mongoose.Schema.Types.Mixed,
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
      index: { expireAfterSeconds: 0 }
    }
  },
  { timestamps: true }
);

export default mongoose.model("ImportBatch", importBatchSchema);
