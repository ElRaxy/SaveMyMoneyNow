// Archivo: frontend\src\views\HistoryView.jsx. Codigo y comentarios en espanol.
import { useEffect, useMemo, useState } from "react";
import Loader from "../components/common/Loader";
import ErrorAlert from "../components/common/ErrorAlert";
import EmptyState from "../components/common/EmptyState";
import EditMovementModal from "../components/history/EditMovementModal";
import { getMovements, updateMovement, deleteMovement } from "../services/movementApi";
import { buildExcelExportUrl, buildPdfExportUrl } from "../services/exportApi";
import { useImportWizard } from "../state/ImportWizardContext";
import { useToast } from "../components/common/Toast";
import { usePersistedState } from "../hooks/usePersistedState";
import { formatAmount } from "../utils/formatAmount";
import { formatDate } from "../utils/formatDate";

// POR QUE persistimos `search` y `page` en localStorage y no los filtros del
// wizard global: el state.filters del Dashboard pertenece al flujo cross-view
// (lo cambia el FilterBar del dashboard). search/page son interaccion local
// del histórico y queremos que sobrevivan a refresh sin afectar al dashboard.
const HISTORY_PERSISTED_KEY = "smn:history:filters";
const HISTORY_PERSISTED_INITIAL = { search: "", page: 1 };

// Iconos SVG inline: ahorra dependencia (no hay lucide/phosphor instalado en
// este proyecto) y mantiene la columna acciones ligera.
const PencilIcon = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

const TrashIcon = (props) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

function HistoryView() {
  const { state } = useImportWizard();
  const showToast = useToast();

  // Estado persistido (search + page). Wrappeado en un objeto unico para que
  // ambos campos viajen juntos y se invaliden de forma coherente.
  const [persisted, setPersisted] = usePersistedState(
    HISTORY_PERSISTED_KEY,
    HISTORY_PERSISTED_INITIAL
  );
  const { search = "", page = 1 } = persisted;

  // Borrador del input: para debounce. Asi el usuario teclea libremente y
  // solo refrescamos cuando se estabiliza.
  const [searchDraft, setSearchDraft] = useState(search);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });
  const [summary, setSummary] = useState({ totalIngresos: 0, totalGastos: 0, balance: 0 });

  // Movimiento que se esta editando (o null si modal cerrado).
  const [editing, setEditing] = useState(null);

  // Filtros del wizard (origen, categoria, fechas, etc.) — no los tocamos.
  const filters = state.filters || {};

  const balance = Number(summary.balance || 0);
  const balanceClass = balance > 0 ? "kpi-positive" : balance < 0 ? "kpi-negative" : "";
  const showEmptyState = !loading && !error && rows.length === 0;

  // Exportaciones: incluir el search activo para mantener coherencia con lo
  // que el usuario esta viendo en pantalla.
  const exportFilters = useMemo(() => {
    const merged = { ...filters };
    if (search) merged.search = search;
    return merged;
  }, [filters, search]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const params = { ...filters, page, limit: 20 };
      if (search) params.search = search;
      const data = await getMovements(params);
      setRows(data.rows || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0, limit: 20 });
      setSummary(data.summary || { totalIngresos: 0, totalGastos: 0, balance: 0 });
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cargar el histórico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  // Debounce 250ms: cuando el draft se estabiliza, lo aplicamos al estado
  // persistido y reseteamos pagina a 1. Es la UX standard (Google, Stripe).
  useEffect(() => {
    if (searchDraft === search) return;
    const timer = window.setTimeout(() => {
      setPersisted({ search: searchDraft, page: 1 });
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const handlePageChange = (next) => {
    setPersisted({ search, page: next });
  };

  const handleEditOpen = (row) => setEditing(row);
  const handleEditClose = () => setEditing(null);

  const handleEditSave = async (patch) => {
    if (!editing) return;
    try {
      await updateMovement(editing._id || editing.id, patch);
      setEditing(null);
      showToast({ message: "Movimiento actualizado", type: "success" });
      loadHistory();
    } catch (err) {
      showToast({
        message: err.response?.data?.message || "No se pudo actualizar el movimiento",
        type: "error"
      });
    }
  };

  const handleDelete = async (row) => {
    const ok = window.confirm("¿Eliminar este movimiento? Esta acción no se puede deshacer.");
    if (!ok) return;
    try {
      await deleteMovement(row._id || row.id);
      showToast({ message: "Movimiento eliminado", type: "success" });
      // Si era la ultima fila de la pagina y no es la primera, retrocedemos
      // pagina para evitar quedarnos en una pagina vacia.
      if (rows.length === 1 && page > 1) {
        setPersisted({ search, page: page - 1 });
      } else {
        loadHistory();
      }
    } catch (err) {
      showToast({
        message: err.response?.data?.message || "No se pudo eliminar el movimiento",
        type: "error"
      });
    }
  };

  return (
    <>
      <h2>Histórico y comparativas</h2>
      <p className="lead">
        Consulta los movimientos guardados, navega por las páginas y exporta a Excel o PDF.
      </p>

      <div className="history-search">
        <label htmlFor="history-search-input" className="visually-hidden">
          Buscar por concepto
        </label>
        <input
          id="history-search-input"
          type="search"
          placeholder="Buscar por concepto..."
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          autoComplete="off"
        />
      </div>

      <ErrorAlert message={error} />
      {loading && <Loader text="Cargando movimientos..." />}

      {showEmptyState ? (
        <EmptyState
          title={search ? "Sin resultados" : "No hay movimientos guardados"}
          description={
            search
              ? "Prueba a ajustar la búsqueda o limpiar el filtro."
              : "Cuando importes un Excel y confirmes la categorización, podrás consultarlos y exportarlos aquí."
          }
          ctaLabel={search ? undefined : "Empezar importación"}
          ctaTo={search ? undefined : "/upload"}
        />
      ) : (
        <>
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
              <p className={`summary-value ${balanceClass}`}>{formatAmount(summary.balance || 0)}</p>
            </article>
          </div>

          <div className="button-row">
            <a className="button-secondary" href={buildExcelExportUrl(exportFilters)} target="_blank" rel="noreferrer">
              Exportar Excel
            </a>
            <a className="button-secondary" href={buildPdfExportUrl(exportFilters)} target="_blank" rel="noreferrer">
              Exportar PDF
            </a>
          </div>

          <div className="table-wrap table-wrap-scroll table-wrap-dense">
            <table>
              <thead>
                <tr>
                  <th scope="col">fecha</th>
                  <th scope="col">concepto</th>
                  <th scope="col">importe</th>
                  <th scope="col">origen</th>
                  <th scope="col">categoría</th>
                  <th scope="col">archivo</th>
                  <th scope="col" aria-label="Acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row._id || row.id}>
                    <td>{formatDate(row.fecha)}</td>
                    <td>{row.concepto}</td>
                    <td>{formatAmount(row.importe)}</td>
                    <td>{row.origen}</td>
                    <td>{row.categoria}</td>
                    <td>{row.archivo}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="button-ghost row-action-btn"
                          onClick={() => handleEditOpen(row)}
                          aria-label={`Editar movimiento ${row.concepto || ""}`}
                          title="Editar"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          className="button-ghost row-action-btn row-action-btn--danger"
                          onClick={() => handleDelete(row)}
                          aria-label={`Eliminar movimiento ${row.concepto || ""}`}
                          title="Eliminar"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="button-row">
            <button
              type="button"
              className="button-ghost"
              disabled={page <= 1}
              onClick={() => handlePageChange(Math.max(1, page - 1))}
            >
              Anterior
            </button>
            <span className="muted">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              type="button"
              className="button-ghost"
              disabled={page >= pagination.totalPages}
              onClick={() => handlePageChange(Math.min(pagination.totalPages, page + 1))}
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      <EditMovementModal
        movement={editing}
        onClose={handleEditClose}
        onSave={handleEditSave}
      />
    </>
  );
}

export default HistoryView;
