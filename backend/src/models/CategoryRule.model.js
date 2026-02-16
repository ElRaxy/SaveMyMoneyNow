// Archivo: backend\src\models\CategoryRule.model.js. Codigo y comentarios en espanol.
import mongoose from "mongoose";

const categoryRuleSchema = new mongoose.Schema(
  {
    keyword: { type: String, required: true, trim: true, lowercase: true, index: true },
    categoria: { type: String, required: true, trim: true },
    priority: { type: Number, default: 100, min: 0, max: 1000 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

categoryRuleSchema.index({ keyword: 1, categoria: 1 }, { unique: true });

export default mongoose.model("CategoryRule", categoryRuleSchema);
