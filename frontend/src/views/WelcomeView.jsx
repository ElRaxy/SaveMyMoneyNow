// Archivo: frontend\src\views\WelcomeView.jsx. Codigo y comentarios en espanol.
import { useNavigate } from "react-router-dom";
import StepLayout from "../components/layout/StepLayout";
import { useImportWizard } from "../state/ImportWizardContext";

function WelcomeView() {
  const navigate = useNavigate();
  const { dispatch, actionTypes } = useImportWizard();

  const start = () => {
    dispatch({ type: actionTypes.RESET });
    navigate("/upload");
  };

  return (
    <StepLayout
      title="Bienvenida"
      subtitle="Importa tus extractos, confirma columnas, categoriza y visualiza tus gastos de forma clara."
    >
      <div className="card">
        <p>
          El asistente te guiara paso a paso para procesar archivos Excel de bancos distintos y dejar todo unificado
          en tu historico.
        </p>
      </div>
      <div className="actions-row">
        <button type="button" onClick={start}>
          Empezar analisis
        </button>
      </div>
    </StepLayout>
  );
}

export default WelcomeView;
