// Archivo: frontend\src\components\dashboard\TrendLineChart.jsx. Codigo y comentarios en espanol.
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatAmount } from "../../utils/formatAmount";

const formatPeriod = (value = "") => {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
  }
  return value;
};

function TrendLineChart({ data = [], mode = "trend", compact = false }) {
  const rows = data.map((item) => ({
    period: item._id,
    neto: Number(item.neto || 0),
    gastos: Number(item.gastos || 0),
    ingresos: Number(item.ingresos || 0)
  }));

  const margin = compact ? { top: 8, right: 8, left: 0, bottom: 4 } : { top: 12, right: 16, left: 4, bottom: 8 };
  const tickFont = compact ? 10 : 12;
  const strokeWidth = compact ? 2 : 3;
  const dotRadius = compact ? 2 : 3;
  const chartHeight = compact ? 170 : 320;

  if (!rows.length) {
    return <p className="chart-empty">Sin datos para representar.</p>;
  }

  if (mode === "comparison") {
    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={rows} margin={margin}>
            <CartesianGrid stroke="#edf1f6" strokeDasharray="3 3" />
            <XAxis dataKey="period" tickFormatter={formatPeriod} tick={{ fill: "#3b4c61", fontSize: tickFont }} />
            <YAxis tick={{ fill: "#3b4c61", fontSize: tickFont }} />
            <Tooltip
              formatter={(value) => formatAmount(value)}
              labelFormatter={formatPeriod}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #d7dce4",
                boxShadow: "0 10px 24px rgba(15, 40, 77, 0.12)"
              }}
            />
            <Legend verticalAlign="top" iconType="circle" height={compact ? 20 : 32} />
            <Line type="monotone" dataKey="gastos" stroke="#d04e41" strokeWidth={strokeWidth} dot={{ r: dotRadius }} />
            <Line type="monotone" dataKey="ingresos" stroke="#2f7e79" strokeWidth={strokeWidth} dot={{ r: dotRadius }} />
            <Line type="monotone" dataKey="neto" stroke="#0f4c81" strokeWidth={strokeWidth} dot={{ r: dotRadius }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <AreaChart data={rows} margin={margin}>
          <defs>
            <linearGradient id="netoFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0f4c81" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#0f4c81" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#edf1f6" strokeDasharray="3 3" />
          <XAxis dataKey="period" tickFormatter={formatPeriod} tick={{ fill: "#3b4c61", fontSize: tickFont }} />
          <YAxis tick={{ fill: "#3b4c61", fontSize: tickFont }} />
          <Tooltip
            formatter={(value) => formatAmount(value)}
            labelFormatter={formatPeriod}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #d7dce4",
              boxShadow: "0 10px 24px rgba(15, 40, 77, 0.12)"
            }}
          />
          <Area
            type="monotone"
            dataKey="neto"
            stroke="#0f4c81"
            strokeWidth={strokeWidth}
            fill="url(#netoFill)"
            dot={{ r: dotRadius }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendLineChart;
