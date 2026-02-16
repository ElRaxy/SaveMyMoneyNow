// Archivo: backend\src\services\Categorization.service.js. Codigo y comentarios en espanol.
import CategoryRule from "../models/CategoryRule.model.js";
import { normalizeText } from "../utils/text.js";

const DEFAULT_RULES = [
  { keyword: "mercadona", categoria: "Comida", priority: 10 },
  { keyword: "dia", categoria: "Comida", priority: 12 },
  { keyword: "lidl", categoria: "Comida", priority: 14 },
  { keyword: "repsol", categoria: "Gasolina", priority: 10 },
  { keyword: "cepsa", categoria: "Gasolina", priority: 12 },
  { keyword: "netflix", categoria: "Ocio", priority: 10 },
  { keyword: "spotify", categoria: "Ocio", priority: 12 },
  { keyword: "farmacia", categoria: "Salud", priority: 10 }
];

export const ensureDefaultRules = async () => {
  for (const rule of DEFAULT_RULES) {
    await CategoryRule.updateOne({ keyword: rule.keyword, categoria: rule.categoria }, { ...rule, active: true }, { upsert: true });
  }
};

export const getActiveRules = async () => {
  return CategoryRule.find({ active: true }).sort({ priority: 1, keyword: 1 }).lean();
};

export const categorizeRows = async (rows) => {
  const rules = await getActiveRules();

  return rows.map((row) => {
    const concept = normalizeText(row.concepto);
    const matchedRule = rules.find((rule) => concept.includes(normalizeText(rule.keyword)));
    return {
      ...row,
      categoria: matchedRule?.categoria || row.categoria || "Otros",
      matchedRuleKeyword: matchedRule?.keyword || null
    };
  });
};

export const applyManualCategoryEdits = (rows, manualCategoryEdits = []) => {
  const editsMap = new Map(manualCategoryEdits.map((item) => [item.tempId, item.categoria]));
  return rows.map((row) => {
    const newCategory = editsMap.get(row.tempId);
    return newCategory ? { ...row, categoria: newCategory } : row;
  });
};

export const applyRuleActions = async (ruleActions = []) => {
  for (const action of ruleActions) {
    if (!action || !action.keyword || !action.categoria) continue;

    if (action.type === "update" && action.id) {
      await CategoryRule.findByIdAndUpdate(action.id, {
        keyword: normalizeText(action.keyword),
        categoria: action.categoria,
        priority: action.priority ?? 100,
        active: action.active ?? true
      });
      continue;
    }

    if (action.type === "delete" && action.id) {
      await CategoryRule.findByIdAndDelete(action.id);
      continue;
    }

    await CategoryRule.updateOne(
      { keyword: normalizeText(action.keyword), categoria: action.categoria },
      {
        keyword: normalizeText(action.keyword),
        categoria: action.categoria,
        priority: action.priority ?? 100,
        active: action.active ?? true
      },
      { upsert: true }
    );
  }
};

export const learnRulesFromCategoryEdits = async (rows, manualCategoryEdits = []) => {
  const editsById = new Map(manualCategoryEdits.map((item) => [item.tempId, item]));

  for (const row of rows) {
    const edit = editsById.get(row.tempId);
    if (!edit) continue;
    if (edit.learn === false) continue;

    const keyword = normalizeText(edit.keyword || row.concepto);
    if (!keyword || !edit.categoria) continue;

    await CategoryRule.updateOne(
      { keyword, categoria: edit.categoria },
      { keyword, categoria: edit.categoria, priority: edit.priority ?? 80, active: true },
      { upsert: true }
    );
  }
};
