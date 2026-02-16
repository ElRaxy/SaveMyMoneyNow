// Archivo: backend\src\services\ExcelDetection.service.js. Codigo y comentarios en espanol.
import path from "path";
import xlsx from "xlsx";
import { normalizeText } from "../utils/text.js";
import { parseDateValue } from "../utils/date.js";
import { parseAmountValue } from "../utils/amount.js";

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
