// Archivo: frontend\src\components\dashboard\InsightsPanel.jsx. Codigo y comentarios en espanol.
import { useMemo } from "react";
import { formatAmount } from "../../utils/formatAmount";

const DIA_SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

const toDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isoDay = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatHumanDay = (iso) => {
  const d = toDate(iso);
  if (!d) return iso;
  return `${DIA_SEMANA[d.getDay()]} ${d.getDate()} ${MES_CORTO[d.getMonth()]}`;
};

const formatPercent = (value) => {
  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(1).replace(".", ",")}%`;
};

const computeCategoriaSubida = (movements) => {
  // Derivar dos periodos a partir de los movimientos: dividir rango temporal por la mediana.
  const gastos = movements
    .map((m) => ({ ...m, _d: toDate(m.fecha), _imp: Number(m.importe || 0) }))
    .filter((m) => m._d && m._imp < 0 && m.categoria);

  if (gastos.length < 2) {
    return { label: "Sin datos suficientes", sub: "Se necesitan al menos 2 períodos para comparar" };
  }

  const sorted = [...gastos].sort((a, b) => a._d - b._d);
  const minTime = sorted[0]._d.getTime();
  const maxTime = sorted[sorted.length - 1]._d.getTime();

  if (minTime === maxTime) {
    return { label: "Sin comparativa disponible", sub: "Se necesita más de un día con gasto" };
  }

  const mid = minTime + (maxTime - minTime) / 2;
  const prev = new Map();
  const curr = new Map();

  for (const g of gastos) {
    const map = g._d.getTime() <= mid ? prev : curr;
    map.set(g.categoria, (map.get(g.categoria) || 0) + Math.abs(g._imp));
  }

  if (prev.size === 0 || curr.size === 0) {
    return { label: "Sin comparativa disponible", sub: "Se necesitan al menos 2 períodos para comparar" };
  }

  let bestCat = null;
  let bestDelta = -Infinity;
  let bestPct = 0;

  for (const [cat, currTotal] of curr.entries()) {
    const prevTotal = prev.get(cat) || 0;
    const delta = currTotal - prevTotal;
    if (prevTotal === 0) continue;
    const pct = (delta / prevTotal) * 100;
    if (delta > bestDelta) {
      bestDelta = delta;
      bestCat = cat;
      bestPct = pct;
    }
  }

  if (!bestCat || bestDelta <= 0) {
    return { label: "Sin subidas detectadas", sub: "Ninguna categoría ha subido respecto al período anterior" };
  }

  return {
    label: bestCat,
    sub: `${formatPercent(bestPct)} vs período anterior`
  };
};

const computeTopConceptos = (movements) => {
  const acc = new Map();
  for (const m of movements) {
    const imp = Number(m.importe || 0);
    if (imp >= 0) continue;
    const concepto = (m.concepto || "").trim();
    if (!concepto) continue;
    acc.set(concepto, (acc.get(concepto) || 0) + Math.abs(imp));
  }
  const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length === 0) {
    return { label: "—", sub: "Sin conceptos de gasto", value: null };
  }
  const total = top.reduce((s, [, v]) => s + v, 0);
  return {
    label: formatAmount(total),
    sub: top.map(([c]) => c).join(", "),
    value: total
  };
};

const computeGastoMedioDia = (movements) => {
  const porDia = new Map();
  for (const m of movements) {
    const imp = Number(m.importe || 0);
    if (imp >= 0) continue;
    const d = toDate(m.fecha);
    if (!d) continue;
    const key = isoDay(d);
    porDia.set(key, (porDia.get(key) || 0) + Math.abs(imp));
  }
  const dias = porDia.size;
  if (dias === 0) {
    return { label: "—", sub: "Sin días con gasto" };
  }
  const total = [...porDia.values()].reduce((s, v) => s + v, 0);
  return {
    label: formatAmount(total / dias),
    sub: `${dias} ${dias === 1 ? "día" : "días"} con gasto`
  };
};

const computeDiaMasGasto = (movements) => {
  const porDia = new Map();
  for (const m of movements) {
    const imp = Number(m.importe || 0);
    if (imp >= 0) continue;
    const d = toDate(m.fecha);
    if (!d) continue;
    const key = isoDay(d);
    porDia.set(key, (porDia.get(key) || 0) + Math.abs(imp));
  }
  if (porDia.size === 0) {
    return { label: "—", sub: "Sin días con gasto" };
  }
  let bestKey = null;
  let bestVal = -Infinity;
  for (const [k, v] of porDia.entries()) {
    if (v > bestVal) {
      bestVal = v;
      bestKey = k;
    }
  }
  return {
    label: formatAmount(bestVal),
    sub: formatHumanDay(bestKey)
  };
};

function InsightsPanel({ movements = [] }) {
  const insights = useMemo(() => {
    if (!Array.isArray(movements) || movements.length === 0) return null;
    return {
      subida: computeCategoriaSubida(movements),
      topConceptos: computeTopConceptos(movements),
      medio: computeGastoMedioDia(movements),
      diaTop: computeDiaMasGasto(movements)
    };
  }, [movements]);

  if (!insights) return null;

  return (
    <section className="insights-section" aria-label="Insights del período filtrado">
      <h3 className="insights-title">Insights</h3>
      <div className="insights-grid">
        <article className="insight-card">
          <p className="summary-label">Categoría que más ha subido</p>
          <p className="summary-value insight-card-value">{insights.subida.label}</p>
          <p className="insight-card-sub">{insights.subida.sub}</p>
        </article>

        <article className="insight-card">
          <p className="summary-label">Top 3 conceptos más caros</p>
          <p className="summary-value insight-card-value">{insights.topConceptos.label}</p>
          <p className="insight-card-sub">{insights.topConceptos.sub}</p>
        </article>

        <article className="insight-card">
          <p className="summary-label">Gasto medio por día</p>
          <p className="summary-value insight-card-value">{insights.medio.label}</p>
          <p className="insight-card-sub">{insights.medio.sub}</p>
        </article>

        <article className="insight-card">
          <p className="summary-label">Día con más gasto</p>
          <p className="summary-value insight-card-value">{insights.diaTop.label}</p>
          <p className="insight-card-sub">{insights.diaTop.sub}</p>
        </article>
      </div>
    </section>
  );
}

export default InsightsPanel;
