// Archivo: backend\src\services\Rule.service.js. Codigo y comentarios en espanol.
import CategoryRule from "../models/CategoryRule.model.js";
import { ensureDefaultRules } from "./Categorization.service.js";

export const listRules = async () => {
  await ensureDefaultRules();
  return CategoryRule.find().sort({ priority: 1, keyword: 1 }).lean();
};

export const createRule = async (payload) => {
  const rule = await CategoryRule.create({
    keyword: String(payload.keyword || "").trim().toLowerCase(),
    categoria: String(payload.categoria || "").trim(),
    priority: Number(payload.priority ?? 100),
    active: payload.active !== false
  });

  return rule.toObject();
};

export const updateRule = async (id, payload) => {
  const rule = await CategoryRule.findByIdAndUpdate(
    id,
    {
      ...(payload.keyword ? { keyword: String(payload.keyword).trim().toLowerCase() } : {}),
      ...(payload.categoria ? { categoria: String(payload.categoria).trim() } : {}),
      ...(payload.priority !== undefined ? { priority: Number(payload.priority) } : {}),
      ...(payload.active !== undefined ? { active: Boolean(payload.active) } : {})
    },
    { new: true }
  ).lean();

  return rule;
};

export const deleteRule = async (id) => {
  await CategoryRule.findByIdAndDelete(id);
};
