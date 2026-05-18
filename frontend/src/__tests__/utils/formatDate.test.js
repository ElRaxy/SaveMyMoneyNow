// Archivo: frontend/src/__tests__/utils/formatDate.test.js. Comentarios en espanol.
//
// Tests para formatDate: contrato con Date.toLocaleDateString("es-ES").
// Formato esperado: D/M/YYYY (sin ceros a la izquierda).
import { describe, it, expect } from "vitest";
import { formatDate } from "../../utils/formatDate";

describe("formatDate", () => {
  it("formatea ISO string a D/M/YYYY (es-ES)", () => {
    // 2025-09-17 UTC. En zona horaria UTC el dia es 17/9/2025.
    // En cualquier zona TZ que no sea UTC-X muy negativa el dia sigue siendo
    // el 17 (es medianoche UTC). En CI usaremos UTC implicito.
    expect(formatDate("2025-09-17T00:00:00.000Z")).toBe("17/9/2025");
  });

  it("devuelve string vacio si recibe null", () => {
    expect(formatDate(null)).toBe("");
  });

  it("devuelve string vacio si recibe undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("devuelve string vacio si recibe string vacio", () => {
    expect(formatDate("")).toBe("");
  });

  it("acepta un Date object", () => {
    const d = new Date("2025-01-05T12:00:00.000Z");
    // 5/1/2025 — sin padding.
    expect(formatDate(d)).toBe("5/1/2025");
  });

  it("devuelve string vacio para fecha invalida", () => {
    expect(formatDate("no-es-una-fecha")).toBe("");
  });

  it("devuelve string vacio para Date invalida", () => {
    expect(formatDate(new Date("invalid"))).toBe("");
  });
});
