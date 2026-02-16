// Archivo: frontend\src\components\dashboard\CategoryPieChart.jsx. Codigo y comentarios en espanol.
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { formatAmount } from "../../utils/formatAmount";

const COLORS = ["#0f4c81", "#ef6f3c", "#f2c14e", "#2f7e79", "#6b7a8f", "#1f6aa5", "#c84c09", "#3d5467"];

function CategoryPieChart({ data = [], compact = false }) {
  const rows = data.map((item) => ({
    name: item._id || "Sin categoria",
    value: Number(item.total || 0)
  }));

  const innerRadius = compact ? 38 : 72;
  const outerRadius = compact ? 64 : 116;
  const legendHeight = compact ? 26 : 36;
  const chartHeight = compact ? 170 : 320;

  if (!rows.length) {
    return <p className="chart-empty">Sin datos para representar.</p>;
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            stroke="#f4f4f5"
            strokeWidth={2}
          >
            {rows.map((entry, index) => (
              <Cell key={`cat-segment-${entry.name}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatAmount(value)}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #d7dce4",
              boxShadow: "0 10px 24px rgba(15, 40, 77, 0.12)"
            }}
          />
          <Legend verticalAlign="bottom" height={legendHeight} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CategoryPieChart;
