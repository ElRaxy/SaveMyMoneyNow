// Archivo: frontend\src\main.jsx. Codigo y comentarios en espanol.
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { ImportWizardProvider } from "./state/ImportWizardContext.jsx";
import "./styles/variables.css";
import "./styles/app.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ImportWizardProvider>
      <App />
    </ImportWizardProvider>
  </BrowserRouter>
);
