// Archivo: frontend\src\views\DashboardView.jsx. Codigo y comentarios en espanol.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepLayout from "../components/layout/StepLayout";
import FilterBar from "../components/dashboard/FilterBar";
import CategoryPieChart from "../components/dashboard/CategoryPieChart";
import MonthlyBarChart from "../components/dashboard/MonthlyBarChart";
import TrendLineChart from "../components/dashboard/TrendLineChart";
import Loader from "../components/common/Loader";
import ErrorAlert from "../components/common/ErrorAlert";
import { getByCategory, getComparison, getMonthlyExpense, getTrend } from "../services/dashboardApi";
import { useImportWizard } from "../state/ImportWizardContext";
import { formatAmount } from "../utils/formatAmount";

function DashboardView() {
  const navigate = useNavigate();
  const { state, dispatch, actionTypes } = useImportWizard();

  const [filters, setFilters] = useState({
    ...state.filters,
    granularity: state.filters.granularity || "month"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [byCategory, setByCategory] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [trend, setTrendData] = useState([]);
  const [comparison, setComparison] = useState([]);

  const lastNet = trend.length ? Number(trend[trend.length - 1].neto || 0) : 0;
  const totalGasto = byCategory.reduce((acc, item) => acc + Number(item.total || 0), 0);
  const totalIngresos = comparison.reduce((acc, item) => acc + Number(item.ingresos || 0), 0);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoryData, monthlyData, trendData, comparisonData] = await Promise.all([
        getByCategory(filters),
        getMonthlyExpense(filters),
        getTrend(filters),
        getComparison(filters)
      ]);

      setByCategory(categoryData || []);
      setMonthly(monthlyData || []);
      setTrendData(trendData || []);
      setComparison(comparisonData || []);
      dispatch({ type: actionTypes.SET_FILTERS, payload: filters });
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar los datos del dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <StepLayout
      title="Dashboard"
      subtitle="Analiza en que se va el dinero con filtros por fechas, origen y categoria."
      compact
      mainClassName="dashboard-main"
    >
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
          <p className="summary-label">Neto ultimo periodo</p>
          <p className="summary-value">{formatAmount(lastNet)}</p>
        </article>
      </div>

      <FilterBar filters={filters} onChange={(values) => setFilters((prev) => ({ ...prev, ...values }))} onApply={loadDashboard} />
      <ErrorAlert message={error} />
      {loading && <Loader text="Cargando dashboard..." />}

      <section className="chart-grid">
        <article className="card chart-card">
          <h3>Gasto por categoria</h3>
          <CategoryPieChart data={byCategory} compact />
        </article>
        <article className="card chart-card">
          <h3>Gasto mensual</h3>
          <MonthlyBarChart data={monthly} compact />
        </article>
        <article className="card chart-card">
          <h3>Evolucion mensual</h3>
          <TrendLineChart data={trend} mode="trend" compact />
        </article>
        <article className="card chart-card">
          <h3>Comparativas</h3>
          <TrendLineChart data={comparison} mode="comparison" compact />
        </article>
      </section>

      <div className="actions-row">
        <button type="button" onClick={() => navigate("/history")}>
          Ver historico y exportar
        </button>
      </div>
    </StepLayout>
  );
}

export default DashboardView;
