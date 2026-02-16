// Archivo: frontend\src\components\dashboard\MonthlyBarChart.jsx. Codigo y comentarios en espanol.
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatAmount } from "../../utils/formatAmount";

const formatMonthLabel = (value = "") => {
  if (!/^\d{4}-\d{2}$/.test(value)) return value;
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
};

function MonthlyBarChart({ data = [], compact = false }) {
  const rows = data.map((item) => ({
    period: item._id,
    gasto: Number(item.total || 0)
  }));

  const margin = compact ? { top: 8, right: 8, left: 0, bottom: 4 } : { top: 12, right: 16, left: 4, bottom: 8 };
  const tickFont = compact ? 10 : 12;
  const maxBarSize = compact ? 34 : 56;
  const chartHeight = compact ? 170 : 320;

  if (!rows.length) {
    return <p className="chart-empty">Sin datos para representar.</p>;
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={rows} margin={margin}>
          <CartesianGrid stroke="#edf1f6" strokeDasharray="3 3" />
          <XAxis dataKey="period" tickFormatter={formatMonthLabel} tick={{ fill: "#3b4c61", fontSize: tickFont }} />
          <YAxis tick={{ fill: "#3b4c61", fontSize: tickFont }} />
          <Tooltip
            formatter={(value) => formatAmount(value)}
            labelFormatter={formatMonthLabel}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #d7dce4",
              boxShadow: "0 10px 24px rgba(15, 40, 77, 0.12)"
            }}
          />
          <Bar dataKey="gasto" fill="#ef6f3c" radius={[8, 8, 2, 2]} maxBarSize={maxBarSize} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlyBarChart;
