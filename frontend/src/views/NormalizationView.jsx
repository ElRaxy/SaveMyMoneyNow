// Archivo: frontend\src\views\NormalizationView.jsx. Codigo y comentarios en espanol.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StepLayout from "../components/layout/StepLayout";
import PreviewTable from "../components/table/PreviewTable";
import { useImportWizard } from "../state/ImportWizardContext";
import { formatDate } from "../utils/formatDate";
import { formatAmount } from "../utils/formatAmount";

function NormalizationView() {
  const navigate = useNavigate();
  const { state } = useImportWizard();

  useEffect(() => {
    if (!state.batchId || !state.normalizedPreview.length) {
      navigate("/confirm");
    }
  }, [state.batchId, state.normalizedPreview.length, navigate]);

  return (
    <StepLayout
      title="Normalizacion de movimientos"
      subtitle="Todos los archivos quedan unificados con el mismo modelo interno para poder comparar y filtrar bien."
    >
      <div className="summary-grid">
        <article className="summary-box">
          <p className="summary-label">Movimientos normalizados</p>
          <p className="summary-value">{state.totalNormalized}</p>
        </article>
        <article className="summary-box">
          <p className="summary-label">Filas invalidas omitidas</p>
          <p className="summary-value">{state.invalidRows.length}</p>
        </article>
      </div>
      <PreviewTable
        headers={["fecha", "concepto", "importe", "origen", "archivo", "categoria"]}
        rows={state.normalizedPreview.slice(0, 25).map((row) => ({
          fecha: formatDate(row.fecha),
          concepto: row.concepto,
          importe: formatAmount(row.importe),
          origen: row.origen,
          archivo: row.archivo,
          categoria: row.categoria || "Otros"
        }))}
      />
      <div className="actions-row">
        <button type="button" onClick={() => navigate("/categorization")}>
          Ir a categorizacion
        </button>
      </div>
    </StepLayout>
  );
}

export default NormalizationView;
