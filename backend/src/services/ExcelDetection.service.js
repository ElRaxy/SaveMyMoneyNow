// Archivo: backend\src\services\ExcelDetection.service.js
//
// Cerebro de la deteccion automatica de columnas. Recibe un .xls/.xlsx
// generado por cualquier banco (BBVA, Santander, Ruralvia, etc.) y devuelve:
//   - en que fila empiezan los headers reales (las primeras filas suelen ser
//     "Nombre", "IBAN" y otras metadatas)
//   - que columna parece la Fecha, el Concepto, el Importe y el Saldo
//
// Estrategia (resumen):
//   1) HEADER_SYNONYMS lista palabras clave por tipo de columna. Cada banco
//      usa su propio vocabulario ("Fecha valor", "Tipo movimiento", "Debe",
//      "Haber"...): mantener un diccionario hace al detector extensible.
//   2) Para cada fila del Excel, contamos cuantos tipos de columna aparecen
//      (scoreHeaderRow). La fila con mayor score se asume cabecera real.
//   3) Una vez detectada la cabecera, asignamos cada tipo de columna mediante
//      un scoring combinado (header + valores reales) para evitar engaños.
//
// La heuristica esta calibrada para ser conservadora: ante la duda, dejamos
// los desplegables disponibles para que el usuario corrija en el paso 3.
import path from "path";
import xlsx from "xlsx";
import { normalizeText } from "../utils/text.js";
import { parseDateValue } from "../utils/date.js";
import { parseAmountValue } from "../utils/amount.js";

// Vocabulario por tipo de columna. Todas las entradas se buscan ya
// NORMALIZADAS (lowercase + sin acentos) - ver normalizeText.
const HEADER_SYNONYMS = {
  fecha: ["fecha", "fecha operacion", "fecha valor", "fecha movimiento", "date"],
  concepto: ["concepto", "descripcion", "tipo movimiento", "detalle", "descripcion operacion"],
  importe: ["importe", "cantidad", "debe", "haber", "cargo", "abono", "amount"],
  saldo: ["saldo", "balance"]
};

const parseRows = (sheet) =>
  xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: ""
  });

// Da una puntuacion (0..4) a una fila concreta segun cuantos de los cuatro
// tipos de columna (fecha, concepto, importe, saldo) aparecen en su texto.
// Concatenamos toda la fila a un unico string para que el "includes" detecte
// tambien expresiones compuestas como "fecha operacion".
const scoreHeaderRow = (row) => {
  const joined = row.map((cell) => normalizeText(cell)).join(" | ");
  let score = 0;
  Object.values(HEADER_SYNONYMS).forEach((keywords) => {
    if (keywords.some((keyword) => joined.includes(keyword))) {
      score += 1;
    }
  });
  return score;
};

// Busca la fila con mejor score. Si nadie llega a 2 (no hay al menos dos
// tipos de columna identificables), asumimos que el Excel empieza por la
// fila 0 - es lo menos malo: el usuario podra corregir manualmente en el
// paso 3 cambiando el numero de "Fila cabecera".
const detectHeaderRow = (rows) => {
  let bestIndex = 0;
  let bestScore = -1;

  rows.forEach((row, index) => {
    const score = scoreHeaderRow(row);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestScore >= 2 ? bestIndex : 0;
};

// Puntua una columna mirando sus PRIMEROS 25 valores reales. Esta heuristica
// "por contenido" complementa la "por nombre": cubre Excels con cabeceras
// raras o ausentes (ej. "Col1, Col2..."). El multiplicador *8 mantiene el
// score comparable con el del header.
const valueHeuristicScore = (target, values) => {
  const usable = values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)
    .slice(0, 25);

  if (!usable.length) return 0;

  if (target === "fecha") {
    const validDates = usable.filter((value) => parseDateValue(value)).length;
    return (validDates / usable.length) * 8;
  }

  if (target === "importe" || target === "saldo") {
    const validAmounts = usable.filter((value) => !Number.isNaN(parseAmountValue(value))).length;
    return (validAmounts / usable.length) * 8;
  }

  if (target === "concepto") {
    const textLike = usable.filter((value) => {
      const isDate = Boolean(parseDateValue(value));
      const isAmount = !Number.isNaN(parseAmountValue(value));
      return !isDate && !isAmount;
    }).length;
    return (textLike / usable.length) * 8;
  }

  return 0;
};

// Puntua una columna por el TEXTO de su cabecera. Premiamos coincidencia
// exacta sobre coincidencia parcial (8 vs 5 puntos) y penalizamos cabeceras
// ambiguas: por ejemplo "Tipo movimiento" entra para concepto, pero si esta
// celda dice "Fecha movimiento" no queremos clasificarla como concepto.
const headerHeuristicScore = (target, normalizedHeader) => {
  let score = 0;
  const keywords = HEADER_SYNONYMS[target] || [];

  keywords.forEach((keyword) => {
    if (normalizedHeader === keyword) score += 8;
    else if (normalizedHeader.includes(keyword)) score += 5;
  });

  // Penalizaciones para evitar columnas ambiguas.
  if (target === "concepto" && normalizedHeader.includes("fecha")) score -= 7;
  if (target === "concepto" && normalizedHeader.includes("saldo")) score -= 4;
  if (target === "concepto" && normalizedHeader.includes("importe")) score -= 4;

  if (target === "fecha" && normalizedHeader.includes("descripcion")) score -= 4;
  if (target === "importe" && normalizedHeader.includes("saldo")) score -= 2;

  return score;
};

// Para cada uno de los cuatro tipos de columna, escogemos el indice cuya
// puntuacion total (header + valores) sea mayor y aun no este asignado.
// El orden de prioridad importa: empezamos por fecha porque es la mas
// disambiguable (parsea como Date), luego importe (parsea como Number),
// luego concepto (lo que sobra que sea texto) y por ultimo saldo.
const detectColumns = (headers, previewRows) => {
  const normalizedHeaders = headers.map((item) => normalizeText(item));
  const possibleColumns = {
    fecha: "",
    concepto: "",
    importe: "",
    saldo: ""
  };

  const usedIndexes = new Set();
  const priority = ["fecha", "importe", "concepto", "saldo"];

  priority.forEach((target) => {
    let bestIndex = -1;
    let bestScore = -999;

    normalizedHeaders.forEach((normalizedHeader, index) => {
      if (usedIndexes.has(index)) return;
      const columnValues = (previewRows || []).map((row) => (Array.isArray(row) ? row[index] : ""));
      const score =
        headerHeuristicScore(target, normalizedHeader) + valueHeuristicScore(target, columnValues);

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    if (bestIndex >= 0 && bestScore > 1) {
      possibleColumns[target] = headers[bestIndex];
      usedIndexes.add(bestIndex);
    }
  });

  return possibleColumns;
};

export const analyzeFile = (filePath) => {
  const workbook = xlsx.readFile(filePath, { cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = parseRows(sheet);

  const headerIndex = detectHeaderRow(rows);
  const headers = (rows[headerIndex] || []).map((header) => String(header || "").trim());
  const previewRows = rows.slice(headerIndex + 1, headerIndex + 6);

  return {
    sheetName,
    fileName: path.basename(filePath),
    headerRowDetected: headerIndex + 1,
    headers,
    possibleColumns: detectColumns(headers, previewRows),
    previewRows
  };
};

export const extractRowsWithHeader = (filePath, headerRow) => {
  const workbook = xlsx.readFile(filePath, { cellDates: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = parseRows(sheet);
  const headerIndex = Math.max(0, Number(headerRow || 1) - 1);
  const headers = (rows[headerIndex] || []).map((header) => String(header || "").trim());

  return rows.slice(headerIndex + 1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });
};
