// Archivo: frontend\src\state\ImportWizardReducer.js
//
// Reducer del wizard de importacion. El estado vive en un Context (ver
// ImportWizardContext.jsx) y agrupa la fotografia completa del flujo
// multi-paso: archivos subidos, deteccion automatica, mapeo confirmado por
// el usuario, preview normalizado, ediciones de categoria, lista de
// conflictos detectados y filtros del dashboard.
//
// Elegimos reducer (en vez de useState x N) por dos razones:
//   1) cada accion describe una transicion clara entre pasos del wizard,
//   2) deja el codigo de las vistas mas limpio: cada una dispatcha eventos
//      sin preocuparse del shape global del estado.
//
// La forma del state es deliberadamente PLANA: facilita serializar, hacer
// time-travel debugging con React DevTools y persistir el estado a
// localStorage si en el futuro queremos resumir flujos interrumpidos.

export const initialState = {
  // ID del lote en BBDD: devuelto por POST /api/import/upload.
  batchId: "",
  // Resumen de los archivos subidos (fileName, fileId, status).
  uploadedFiles: [],
  // Detecciones automaticas por archivo (headerRow + columnas candidatas).
  detections: [],
  // Mapeo final que el usuario confirma en el paso 3. Indexado por fileId.
  mappings: {},
  // Lote completo de filas normalizadas (modelo unico fecha/concepto/...).
  normalizedPreview: [],
  totalNormalized: 0,
  // Filas que no pudieron parsearse (fecha invalida, importe NaN...).
  invalidRows: [],
  // Filas tras aplicar reglas de categorizacion + ediciones manuales.
  categorizedRows: [],
  // Cambios manuales del usuario en la tabla del paso 5. Forma:
  //   [{ tempId, categoria, keyword, learn }]
  categoryEdits: [],
  // Reglas nuevas creadas por el usuario antes del commit.
  ruleActions: [],
  // Resultado del check de duplicados pre-commit.
  duplicates: {
    nonConflicts: [],
    conflicts: []
  },
  // Resumen devuelto por POST /commit (inserted, replaced, keptExisting...).
  commitSummary: null,
  // Filtros del dashboard / historico.
  filters: {
    from: "",
    to: "",
    origen: "",
    categoria: ""
  }
};

// Tipos de accion. Usamos constantes (en vez de strings sueltos en cada
// dispatch) para que un typo se convierta en un error JS visible y para
// poder grep-ear rapido quien escucha cada evento.
export const actionTypes = {
  RESET: "RESET",
  SET_BATCH: "SET_BATCH",
  SET_DETECTIONS: "SET_DETECTIONS",
  SET_MAPPINGS: "SET_MAPPINGS",
  SET_NORMALIZED: "SET_NORMALIZED",
  SET_CATEGORIZED: "SET_CATEGORIZED",
  SET_CATEGORY_EDITS: "SET_CATEGORY_EDITS",
  SET_RULE_ACTIONS: "SET_RULE_ACTIONS",
  SET_DUPLICATES: "SET_DUPLICATES",
  SET_COMMIT_SUMMARY: "SET_COMMIT_SUMMARY",
  SET_FILTERS: "SET_FILTERS"
};

export function importWizardReducer(state, action) {
  switch (action.type) {
    case actionTypes.RESET:
      return initialState;
    case actionTypes.SET_BATCH:
      return {
        ...state,
        batchId: action.payload.batchId,
        uploadedFiles: action.payload.files || []
      };
    case actionTypes.SET_DETECTIONS:
      return {
        ...state,
        detections: action.payload
      };
    case actionTypes.SET_MAPPINGS:
      return {
        ...state,
        mappings: action.payload
      };
    case actionTypes.SET_NORMALIZED:
      return {
        ...state,
        normalizedPreview: action.payload.normalizedPreview,
        totalNormalized: action.payload.totalNormalized,
        invalidRows: action.payload.invalidRows || []
      };
    case actionTypes.SET_CATEGORIZED:
      return {
        ...state,
        categorizedRows: action.payload
      };
    case actionTypes.SET_CATEGORY_EDITS:
      return {
        ...state,
        categoryEdits: action.payload
      };
    case actionTypes.SET_RULE_ACTIONS:
      return {
        ...state,
        ruleActions: action.payload
      };
    case actionTypes.SET_DUPLICATES:
      return {
        ...state,
        duplicates: action.payload
      };
    case actionTypes.SET_COMMIT_SUMMARY:
      return {
        ...state,
        commitSummary: action.payload
      };
    case actionTypes.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload
        }
      };
    default:
      return state;
  }
}
