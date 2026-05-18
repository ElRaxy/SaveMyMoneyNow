// Archivo: frontend/src/__tests__/components/InsightsPanel.test.jsx. Comentarios en espanol.
//
// Datos sinteticos: 5 movimientos con dos categorias y tres conceptos.
// Calculamos manualmente los valores esperados y verificamos las 4 cards.
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InsightsPanel from "../../components/dashboard/InsightsPanel";

const stripWS = (s) => s.replace(/\s+/g, " ");

describe("InsightsPanel", () => {
  it("devuelve null cuando movements esta vacio", () => {
    const { container } = render(<InsightsPanel movements={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("devuelve null cuando movements es undefined (default [])", () => {
    const { container } = render(<InsightsPanel />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza las 4 cards de insights con datos sinteticos coherentes", () => {
    // Construimos 2 periodos:
    //   Periodo 1 (enero): supermercado 100€, restaurante 30€.
    //   Periodo 2 (febrero): supermercado 200€, restaurante 40€, gasolinera 80€.
    //
    // Expectativas:
    //   - Categoria que mas ha subido: supermercado (+100€, +100%).
    //   - Top 3 conceptos por importe absoluto: Mercadona (300€), DinoPark (80€), Bar Pepe (70€)
    //     -> total = 450€.
    //   - Dias con gasto: 5 fechas distintas (1, 15, 2, 10, 20).
    //   - Gasto medio por dia: (130 + 200 + 40 + 80) / 4 distinct days?
    //     Aclaracion: agrupamos por dia ISO. Calculamos abajo.
    const movements = [
      // Periodo 1
      { fecha: "2025-01-05T00:00:00.000Z", concepto: "Mercadona", categoria: "supermercado", importe: -100 },
      { fecha: "2025-01-15T00:00:00.000Z", concepto: "Bar Pepe",  categoria: "restaurante", importe: -30 },
      // Periodo 2
      { fecha: "2025-02-02T00:00:00.000Z", concepto: "Mercadona", categoria: "supermercado", importe: -200 },
      { fecha: "2025-02-10T00:00:00.000Z", concepto: "Bar Pepe",  categoria: "restaurante", importe: -40 },
      { fecha: "2025-02-20T00:00:00.000Z", concepto: "DinoPark",  categoria: "gasolinera", importe: -80 }
    ];

    render(<InsightsPanel movements={movements} />);

    // Label de seccion
    expect(screen.getByRole("region", { name: /Insights del período filtrado/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Insights" })).toBeInTheDocument();

    // Card 1: Categoria que mas ha subido => supermercado.
    // El algoritmo split por mediana temporal => prev contiene los primeros 50%
    // del rango, curr los segundos. Con el dataset anterior:
    //   minTime = 2025-01-05, maxTime = 2025-02-20.
    //   mid = punto medio aprox 2025-01-28. Asi prev = enero (100, 30) y curr
    //   = febrero (200, 40, 80). Para supermercado: prev=100, curr=200, delta=+100.
    //   Para restaurante: prev=30, curr=40, delta=+10. supermercado tiene mayor delta.
    expect(screen.getByText("Categoría que más ha subido")).toBeInTheDocument();
    expect(screen.getByText("supermercado")).toBeInTheDocument();

    // Card 2: Top 3 conceptos: total = 100+30+200+40+80 = 450€
    expect(screen.getByText("Top 3 conceptos más caros")).toBeInTheDocument();
    // Sub: conceptos ordenados por gasto desc.
    //   Mercadona: 100+200 = 300
    //   DinoPark:  80
    //   Bar Pepe:  30+40 = 70
    // -> top3 = [Mercadona, DinoPark, Bar Pepe], total 450.
    // Buscamos el sub que contiene los tres conceptos:
    expect(screen.getByText("Mercadona, DinoPark, Bar Pepe")).toBeInTheDocument();

    // Verificar que el valor formateado del total aparece (tolerante a NBSP).
    const valueNodes = screen.getAllByText((_, el) => {
      if (!el || el.classList?.contains("insight-card-value") !== true) return false;
      return stripWS(el.textContent) === "450,00 €";
    });
    expect(valueNodes.length).toBeGreaterThanOrEqual(1);

    // Card 3: Gasto medio por dia.
    //   Dias con gasto distintos: 5 (todas las fechas son dias diferentes).
    //   Total gasto: 450. Media = 90.
    expect(screen.getByText("Gasto medio por día")).toBeInTheDocument();
    expect(screen.getByText("5 días con gasto")).toBeInTheDocument();
    const mediaNodes = screen.getAllByText((_, el) => {
      if (!el || el.classList?.contains("insight-card-value") !== true) return false;
      return stripWS(el.textContent) === "90,00 €";
    });
    expect(mediaNodes.length).toBeGreaterThanOrEqual(1);

    // Card 4: Dia con mas gasto.
    //   Mayor importe en un solo dia: 2025-02-02 con 200€ (Mercadona).
    expect(screen.getByText("Día con más gasto")).toBeInTheDocument();
    const topDayNodes = screen.getAllByText((_, el) => {
      if (!el || el.classList?.contains("insight-card-value") !== true) return false;
      return stripWS(el.textContent) === "200,00 €";
    });
    expect(topDayNodes.length).toBeGreaterThanOrEqual(1);
  });

  it("muestra mensaje informativo cuando no hay datos suficientes para comparar", () => {
    // Solo 1 gasto -> 'Sin datos suficientes'.
    const movements = [
      { fecha: "2025-01-05T00:00:00.000Z", concepto: "Mercadona", categoria: "supermercado", importe: -100 }
    ];
    render(<InsightsPanel movements={movements} />);
    expect(screen.getByText("Sin datos suficientes")).toBeInTheDocument();
  });
});
