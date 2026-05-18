// Archivo: frontend\src\views\DashboardView.jsx. Codigo y comentarios en espanol.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterBar from "../components/dashboard/FilterBar";
import CategoryPieChart from "../components/dashboard/CategoryPieChart";
import MonthlyBarChart from "../components/dashboard/MonthlyBarChart";
import TrendLineChart from "../components/dashboard/TrendLineChart";
import InsightsPanel from "../components/dashboard/InsightsPanel";
import Loader from "../components/common/Loader";
import ErrorAlert from "../components/common/ErrorAlert";
import EmptyState from "../components/common/EmptyState";
import { getByCategory, getComparison, getMonthlyExpense, getTrend } from "../services/dashboardApi";
import { getMovements } from "../services/movementApi";
import { useImportWizard } from "../state/ImportWizardContext";
import { usePersistedState } from "../hooks/usePersistedState";
import { formatAmount } from "../utils/formatAmount";

// POR QUE persistimos los filtros del dashboard en localStorage:
//   El usuario sufre cada refresh perdiendo el rango de fechas y la
//   granularidad que acababa de configurar. Persistirlo permite volver al
//   estado exacto, sin tocar el ImportWizardContext (que sigue siendo la
//   fuente de verdad mientras la sesion vive en memoria).
const DASHBOARD_FILTERS_KEY = "smn:dashboard:filters";

function DashboardView() {
  const navigate = useNavigate();
  const { state, dispatch, actionTypes } = useImportWizard();

  const [filters, setFilters] = usePersistedState(DASHBOARD_FILTERS_KEY, {
    ...state.filters,
    granularity: state.filters.granularity || "month"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [byCategory, setByCategory] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [trend, setTrendData] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [movements, setMovements] = useState([]);

  const lastNet = trend.length ? Number(trend[trend.length - 1].neto || 0) : 0;
  const totalGasto = byCategory.reduce((acc, item) => acc + Number(item.total || 0), 0);
  const totalIngresos = comparison.reduce((acc, item) => acc + Number(item.ingresos || 0), 0);
  const hasData = byCategory.length > 0 || monthly.length > 0 || trend.length > 0;
  const showEmptyState = !loading && !error && !hasData;

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoryData, monthlyData, trendData, comparisonData, movementsData] = await Promise.all([
        getByCategory(filters),
        getMonthlyExpense(filters),
        getTrend(filters),
        getComparison(filters),
        getMovements({ ...filters, limit: 5000 })
      ]);

      setByCategory(categoryData || []);
      setMonthly(monthlyData || []);
      setTrendData(trendData || []);
      setComparison(comparisonData || []);
      setMovements(movementsData?.rows || []);
      dispatch({ type: actionTypes.SET_FILTERS, payload: filters });
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar los datos del dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <>
      <h2>Dashboard</h2>
      <p className="lead">
        Analiza en qué se va el dinero con filtros por fechas, origen y categoría.
      </p>
      {state.commitSummary && (
        <div className="summary-grid">
          <article className="summary-box">
            <p className="summary-label">Insertados</p>
            <p className="summary-value">{state.commitSummary.inserted}</p>
          </article>
          <article className="summary-box">
            <p className="summary-label">Reemplazados</p>
            <p className="summary-value">{state.commitSummary.replaced}</p>
          </article>
          <article className="summary-box">
            <p className="summary-label">Mantenidos existentes</p>
            <p className="summary-value">{state.commitSummary.keptExisting}</p>
          </article>
          <article className="summary-box">
            <p className="summary-label">Mantenidos ambos</p>
            <p className="summary-value">{state.commitSummary.keptBoth}</p>
          </article>
        </div>
      )}

      <FilterBar filters={filters} onChange={(values) => setFilters((prev) => ({ ...prev, ...values }))} onApply={loadDashboard} />
      <ErrorAlert message={error} />
      {loading && <Loader text="Cargando dashboard..." />}

      {showEmptyState ? (
        <EmptyState
          title="Aún no hay movimientos"
          description="Importa tu primer Excel para ver el dashboard con tus categorías, evolución y comparativas."
          ctaLabel="Empezar importación"
          ctaTo="/upload"
        />
      ) : (
        <>
          <div className="kpi-grid">
            <article className="kpi-card">
              <p className="summary-label">Gasto total filtrado</p>
              <p className="summary-value">{formatAmount(totalGasto)}</p>
            </article>
            <article className="kpi-card">
              <p className="summary-label">Ingresos totales filtrados</p>
              <p className="summary-value">{formatAmount(totalIngresos)}</p>
            </article>
            <article className="kpi-card">
              <p className="summary-label">Neto último período</p>
              <p className={`summary-value ${lastNet > 0 ? "kpi-positive" : lastNet < 0 ? "kpi-negative" : ""}`}>
                {formatAmount(lastNet)}
              </p>
            </article>
          </div>

          <InsightsPanel
            byCategory={byCategory}
            comparison={comparison}
            trend={trend}
            movements={movements}
          />

          <section className="chart-grid">
            <article className="card chart-card">
              <h3>Gasto por categoría</h3>
              <CategoryPieChart data={byCategory} compact />
            </article>
            <article className="card chart-card">
              <h3>Gasto mensual</h3>
              <MonthlyBarChart data={monthly} compact />
            </article>
            <article className="card chart-card">
              <h3>Evolución mensual</h3>
              <TrendLineChart data={trend} mode="trend" compact />
            </article>
            <article className="card chart-card">
              <h3>Comparativas</h3>
              <TrendLineChart data={comparison} mode="comparison" compact />
            </article>
          </section>

          <div className="actions-row">
            <button type="button" onClick={() => navigate("/history")}>
              Ver histórico y exportar
            </button>
          </div>
        </>
      )}
    </>
  );
}

export default DashboardView;
