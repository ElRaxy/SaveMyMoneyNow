// Archivo: frontend\src\views\HistoryView.jsx. Codigo y comentarios en espanol.
import { useEffect, useState } from "react";
import StepLayout from "../components/layout/StepLayout";
import PreviewTable from "../components/table/PreviewTable";
import Loader from "../components/common/Loader";
import ErrorAlert from "../components/common/ErrorAlert";
import { getMovements } from "../services/movementApi";
import { buildExcelExportUrl, buildPdfExportUrl } from "../services/exportApi";
import { useImportWizard } from "../state/ImportWizardContext";
import { formatAmount } from "../utils/formatAmount";
import { formatDate } from "../utils/formatDate";

function HistoryView() {
  const { state } = useImportWizard();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [summary, setSummary] = useState({ totalIngresos: 0, totalGastos: 0, balance: 0 });

  const filters = state.filters || {};

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMovements({ ...filters, page, limit: 20 });
      setRows(data.rows || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0, limit: 20 });
      setSummary(data.summary || { totalIngresos: 0, totalGastos: 0, balance: 0 });
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cargar el historico");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page]);

  return (
    <StepLayout
      title="Historico y comparativas"
      subtitle="Consulta los movimientos persistidos, pagina resultados y exporta a Excel o PDF."
    >
      <div className="kpi-grid">
        <article className="kpi-card">
          <p className="summary-label">Total ingresos</p>
          <p className="summary-value">{formatAmount(summary.totalIngresos || 0)}</p>
        </article>
        <article className="kpi-card">
          <p className="summary-label">Total gastos</p>
          <p className="summary-value">{formatAmount(summary.totalGastos || 0)}</p>
        </article>
        <article className="kpi-card">
          <p className="summary-label">Balance</p>
          <p className="summary-value">{formatAmount(summary.balance || 0)}</p>
        </article>
      </div>

      <div className="button-row">
        <a href={buildExcelExportUrl(filters)} target="_blank" rel="noreferrer">
          Exportar Excel
        </a>
        <a href={buildPdfExportUrl(filters)} target="_blank" rel="noreferrer">
          Exportar PDF
        </a>
      </div>

      <ErrorAlert message={error} />
      {loading && <Loader text="Cargando movimientos..." />}

      <PreviewTable
        className="table-wrap-scroll table-wrap-dense"
        headers={["fecha", "concepto", "importe", "origen", "categoria", "archivo"]}
        rows={rows.map((row) => ({
          fecha: formatDate(row.fecha),
          concepto: row.concepto,
          importe: formatAmount(row.importe),
          origen: row.origen,
          categoria: row.categoria,
          archivo: row.archivo
        }))}
      />

      <div className="button-row">
        <button type="button" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
          Anterior
        </button>
        <span className="muted">
          Pagina {pagination.page} de {pagination.totalPages}
        </span>
        <button
          type="button"
          disabled={page >= pagination.totalPages}
          onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
        >
          Siguiente
        </button>
      </div>
    </StepLayout>
  );
}

export default HistoryView;
