// Archivo: backend\src\services\Normalization.service.js. Codigo y comentarios en espanol.
import { parseDateValue, toISODate } from "../utils/date.js";
import { parseAmountValue } from "../utils/amount.js";
import { normalizeConcept } from "../utils/text.js";

const buildFingerprintKey = (fecha, concepto) => `${toISODate(fecha)}|${normalizeConcept(concepto)}`;
const buildExactKey = (fecha, concepto, importe) => `${buildFingerprintKey(fecha, concepto)}|${importe}`;

export const normalizeRowsForFile = ({ rows, mapping, origen, fileName, fileId }) => {
  const normalizedRows = [];
  const invalidRows = [];

  rows.forEach((row, index) => {
    const rawFecha = row[mapping.fecha];
    const rawConcepto = row[mapping.concepto];
    const rawImporte = row[mapping.importe];

    const fecha = parseDateValue(rawFecha);
    const concepto = String(rawConcepto || "").trim();
    const importe = parseAmountValue(rawImporte);

    if (!fecha || !concepto || Number.isNaN(importe)) {
      invalidRows.push({
        fileId,
        fileName,
        rowIndex: index + 1,
        row,
        reason: "Fila con fecha/concepto/importe invalido"
      });
      return;
    }

    const fingerprintKey = buildFingerprintKey(fecha, concepto);
    const exactKey = buildExactKey(fecha, concepto, importe);

    normalizedRows.push({
      tempId: `${fileId}-${index + 1}`,
      fileId,
      fecha: fecha.toISOString(),
      concepto,
      importe,
      origen: origen || "otro",
      archivo: fileName,
      categoria: "Otros",
      fingerprintKey,
      exactKey
    });
  });

  return { normalizedRows, invalidRows };
};

export const toMovementDocument = (row) => ({
  fecha: new Date(row.fecha),
  concepto: row.concepto,
  importe: row.importe,
  origen: row.origen,
  archivo: row.archivo,
  categoria: row.categoria || "Otros",
  fingerprintKey: row.fingerprintKey,
  exactKey: row.exactKey
});
