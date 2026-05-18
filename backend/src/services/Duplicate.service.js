// Archivo: backend\src\services\Duplicate.service.js
//
// Servicio de deteccion de duplicados.
//
// Decision de diseno (importante):
//   El enunciado pide controlar el caso "subir dos veces el mismo Excel" y
//   ofrecer al usuario tres opciones por fila en conflicto:
//     - "keep_existing"  -> nos quedamos con lo que ya hay en BBDD
//     - "replace"        -> sobreescribimos la fila existente con la nueva
//     - "keep_both"      -> insertamos la nueva como movimiento adicional
//
//   La regla del PDF para la opcion por defecto es:
//     - Si el importe coincide -> "keep_existing"  (probable reimportacion)
//     - Si el importe difiere  -> "keep_both"     (suelen ser dos compras
//                                                  reales del mismo dia)
//
//   La huella de un movimiento es `fecha|concepto` (fingerprintKey). El
//   importe NO entra en la huella aposta: queremos detectar "Mercadona el
//   17/09" como conflicto aunque la cantidad sea distinta.
//
//   Cuando un mismo fingerprint tiene varios documentos previos en BBDD
//   (escenario real: tres compras en Mercadona el mismo dia con importes
//   distintos), la heuristica del defaultAction es:
//     - Si ALGUN existing tiene exactamente el mismo importe que la nueva
//       fila -> "keep_existing" (es plausible que estemos reimportando un
//       Excel que ya subimos).
//     - Si NINGUN existing coincide en importe -> "keep_both" (la nueva fila
//       es una compra distinta).
//
//   Esto coincide literalmente con la nota del enunciado y mantiene el
//   default conservador: por defecto NO duplicamos cuando hay sospecha de
//   reimportacion exacta.

import Movement from "../models/Movement.model.js";

export const checkRowsAgainstDatabase = async (rows = []) => {
  if (!rows.length) {
    return { nonConflicts: [], conflicts: [] };
  }

  // Buscamos en BBDD por fingerprintKey en una sola query (operador $in) en
  // vez de N queries: rendimiento y menos round-trips a Mongo.
  const fingerprintKeys = [...new Set(rows.map((row) => row.fingerprintKey))];
  const existingRows = await Movement.find({ fingerprintKey: { $in: fingerprintKeys } }).lean();

  // Agrupamos los existing por fingerprint para hacer lookup O(1) por fila
  // entrante. Usar un Map (no objeto plano) evita problemas con conceptos
  // que choquen con propiedades heredadas tipo "constructor".
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
      // No hay nada en BBDD con esa fecha+concepto: importacion limpia.
      nonConflicts.push(incomingRow);
      return;
    }

    // Ver Decision de diseno (cabecera del archivo) para la heuristica.
    const sameAmountExists = existingMatches.some((existingRow) => existingRow.importe === incomingRow.importe);
    const defaultAction = sameAmountExists ? "keep_existing" : "keep_both";

    conflicts.push({
      conflictKey: incomingRow.tempId,
      incomingRow,
      // Devolvemos TODOS los existing al frontend para que el usuario tenga
      // contexto completo y pueda decidir con criterio.
      existingRows: existingMatches,
      defaultAction
    });
  });

  return { nonConflicts, conflicts };
};
