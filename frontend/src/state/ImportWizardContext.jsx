// Archivo: frontend\src\state\ImportWizardContext.jsx. Codigo y comentarios en espanol.
import { createContext, useContext, useMemo, useReducer } from "react";
import { actionTypes, importWizardReducer, initialState } from "./ImportWizardReducer";

const ImportWizardContext = createContext(null);

export function ImportWizardProvider({ children }) {
  const [state, dispatch] = useReducer(importWizardReducer, initialState);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      actionTypes
    }),
    [state]
  );

  return <ImportWizardContext.Provider value={value}>{children}</ImportWizardContext.Provider>;
}

export function useImportWizard() {
  const context = useContext(ImportWizardContext);
  if (!context) {
    throw new Error("useImportWizard debe usarse dentro de ImportWizardProvider");
  }

  return context;
}

