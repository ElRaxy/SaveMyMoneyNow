// Tests de ExcelDetection.service.
//
// Las funciones internas (scoreHeaderRow, detectColumns) NO estan exportadas,
// asi que verificamos la heuristica end-to-end via `analyzeFile`, que es la
// API publica. Esto cubre:
//   - deteccion de la fila de cabecera real (saltarse metadata previa).
//   - mapeo de columnas Fecha/Concepto/Importe en estilos BBVA y Santander.
//
// Usamos os.tmpdir() para escribir un archivo real porque `analyzeFile`
// llama a xlsx.readFile (no acepta buffer).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { analyzeFile, extractRowsWithHeader } from "../../src/services/ExcelDetection.service.js";
import { buildBbvaXlsx } from "../fixtures/buildBbvaXlsx.js";
import { buildSantanderXlsx } from "../fixtures/buildSantanderXlsx.js";

let bbvaPath;
let santanderPath;

beforeAll(() => {
  bbvaPath = path.join(os.tmpdir(), `bbva-${Date.now()}.xlsx`);
  santanderPath = path.join(os.tmpdir(), `santander-${Date.now()}.xlsx`);
  fs.writeFileSync(bbvaPath, buildBbvaXlsx());
  fs.writeFileSync(santanderPath, buildSantanderXlsx());
});

afterAll(() => {
  if (fs.existsSync(bbvaPath)) fs.unlinkSync(bbvaPath);
  if (fs.existsSync(santanderPath)) fs.unlinkSync(santanderPath);
});

describe("analyzeFile estilo BBVA", () => {
  it("detecta la fila de cabecera real en la 4 (1-based)", () => {
    const result = analyzeFile(bbvaPath);
    expect(result.headerRowDetected).toBe(4);
  });

  it("detecta correctamente las columnas Fecha Operacion / Tipo Movimiento / Importe", () => {
    const result = analyzeFile(bbvaPath);
    expect(result.possibleColumns.fecha).toBe("Fecha Operacion");
    expect(result.possibleColumns.concepto).toBe("Tipo Movimiento");
    expect(result.possibleColumns.importe).toBe("Importe");
    expect(result.possibleColumns.saldo).toBe("Saldo");
  });

  it("devuelve previewRows con datos reales (no metadata)", () => {
    const result = analyzeFile(bbvaPath);
    expect(result.previewRows.length).toBeGreaterThan(0);
    // La primera preview row tiene 5 columnas (fecha, fecha valor, tipo,
    // importe, saldo). La 3a celda debe ser la descripcion del movimiento.
    expect(String(result.previewRows[0][2])).toContain("MERCADONA");
  });
});

describe("analyzeFile estilo Santander", () => {
  it("detecta la cabecera en la fila 1", () => {
    const result = analyzeFile(santanderPath);
    expect(result.headerRowDetected).toBe(1);
  });

  it("mapea Fecha / Descripcion / Cantidad correctamente", () => {
    const result = analyzeFile(santanderPath);
    expect(result.possibleColumns.fecha).toBe("Fecha");
    expect(result.possibleColumns.concepto).toBe("Descripcion");
    expect(result.possibleColumns.importe).toBe("Cantidad");
  });
});

describe("extractRowsWithHeader", () => {
  it("extrae filas como objetos usando los headers reales (BBVA)", () => {
    const rows = extractRowsWithHeader(bbvaPath, 4);
    expect(rows.length).toBe(6); // 6 movimientos en la fixture
    expect(rows[0]).toHaveProperty("Fecha Operacion");
    expect(rows[0]).toHaveProperty("Importe");
    expect(String(rows[0]["Tipo Movimiento"])).toContain("MERCADONA");
  });

  it("extrae filas como objetos para Santander con headerRow=1", () => {
    const rows = extractRowsWithHeader(santanderPath, 1);
    expect(rows.length).toBe(6);
    expect(rows[0]).toHaveProperty("Fecha");
    expect(rows[0]).toHaveProperty("Descripcion");
    expect(rows[0]).toHaveProperty("Cantidad");
  });
});
