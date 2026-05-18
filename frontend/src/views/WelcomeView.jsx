// Archivo: frontend\src\views\WelcomeView.jsx
//
// Pantalla de bienvenida (paso 0). Reset del estado del wizard + CTA al
// paso 1. Estilo deliberadamente airoso: hero simple con titulo grande,
// subtitulo descriptivo y CTA, sin tarjetas decorativas que aporten ruido.
import { useNavigate } from "react-router-dom";
import { useImportWizard } from "../state/ImportWizardContext";

function WelcomeView() {
  const navigate = useNavigate();
  const { dispatch, actionTypes } = useImportWizard();

  const start = () => {
    dispatch({ type: actionTypes.RESET });
    navigate("/upload");
  };

  return (
    <>
      <h2>Bienvenida</h2>
      <p className="lead">
        Importa tus extractos bancarios en Excel y convierte cada movimiento en una decisión clara
        sobre dónde se va tu dinero.
      </p>
      <p className="muted" style={{ maxWidth: "60ch", marginBottom: "var(--space-8)" }}>
        El asistente te guía paso a paso: detecta automáticamente las columnas de cada banco, te
        deja confirmar lo importante, categoriza los gastos con reglas reutilizables, controla
        duplicados y termina en un dashboard con tus comparativas mensuales.
      </p>
      <div className="actions-row">
        <button type="button" onClick={start}>
          Empezar análisis
        </button>
      </div>
    </>
  );
}

export default WelcomeView;
