// Archivo: frontend\src\state\ImportWizardReducer.js. Codigo y comentarios en espanol.
export const initialState = {
  batchId: "",
  uploadedFiles: [],
  detections: [],
  mappings: {},
  normalizedPreview: [],
  totalNormalized: 0,
  invalidRows: [],
  categorizedRows: [],
  categoryEdits: [],
  ruleActions: [],
  duplicates: {
    nonConflicts: [],
    conflicts: []
  },
  commitSummary: null,
  filters: {
    from: "",
    to: "",
    origen: "",
    categoria: ""
  }
};

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
