// Archivo: backend\src\services\Duplicate.service.js. Codigo y comentarios en espanol.
import Movement from "../models/Movement.model.js";

export const checkRowsAgainstDatabase = async (rows = []) => {
  if (!rows.length) {
    return { nonConflicts: [], conflicts: [] };
  }

  const fingerprintKeys = [...new Set(rows.map((row) => row.fingerprintKey))];
  const existingRows = await Movement.find({ fingerprintKey: { $in: fingerprintKeys } }).lean();

  const existingByFingerprint = new Map();
  existingRows.forEach((row) => {
    const key = row.fingerprintKey;
    if (!existingByFingerprint.has(key)) {
      existingByFingerprint.set(key, []);
    }
    existingByFingerprint.get(key).push(row);
  });

  const nonConflicts = [];
  const conflicts = [];

  rows.forEach((incomingRow) => {
    const existingMatches = existingByFingerprint.get(incomingRow.fingerprintKey) || [];

    if (!existingMatches.length) {
      nonConflicts.push(incomingRow);
      return;
    }

    const sameAmountExists = existingMatches.some((existingRow) => existingRow.importe === incomingRow.importe);
    const defaultAction = sameAmountExists ? "keep_existing" : "keep_both";

    conflicts.push({
      conflictKey: incomingRow.tempId,
      incomingRow,
      existingRows: existingMatches,
      defaultAction
    });
  });

  return { nonConflicts, conflicts };
};
