// Archivo: backend\src\services\Categorization.service.js
//
// Sistema de categorizacion de movimientos basado en REGLAS PERSISTIDAS en
// Mongo. Una regla es: si el concepto contiene `keyword` -> asignar
// `categoria`. Las reglas tienen `priority` (numero entero) para resolver
// conflictos: a MENOR numero, MAYOR prioridad (no es intuitivo: lo
// elegimos asi para poder anteponer reglas "naturales" como "mercadona->
// Comida" con priority 10 frente a reglas aprendidas por el usuario con
// priority 80-100). La ordenacion en getActiveRules() ya respeta ese
// criterio.
//
// Ciclo completo:
//   1) ensureDefaultRules() -> escribe en BBDD las reglas semilla.
//   2) categorizeRows()      -> aplica reglas a un lote (auto).
//   3) applyManualCategoryEdits() -> sobre-escribe lo anterior con la
//      edicion manual del usuario en el paso 5.
//   4) learnRulesFromCategoryEdits() -> guarda las ediciones marcadas como
//      "aprender" como nueva regla, para futuras importaciones.
import CategoryRule from "../models/CategoryRule.model.js";
import { normalizeText } from "../utils/text.js";

// Reglas semilla. Se insertan via upsert: si existen ya con otra prioridad,
// no las pisamos; si no existen, las creamos. Esto evita romper aprendizaje
// previo del usuario al reiniciar el servidor.
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

// Recorre las reglas en orden de prioridad y se queda con la PRIMERA que
// matchea. Por eso ordenamos en getActiveRules() por priority ascendente:
// la regla mas especifica/preferida gana. Si nada matchea, mantenemos la
// categoria que pueda venir del paso anterior o "Otros" como fallback.
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
