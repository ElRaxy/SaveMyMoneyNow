// Servicio principal de importacion: deteccion, normalizacion, categorizacion y guardado final.
import { randomUUID } from "crypto";
import fs from "node:fs";
import ImportBatch from "../models/ImportBatch.model.js";
import Movement from "../models/Movement.model.js";
import { analyzeFile, extractRowsWithHeader } from "./ExcelDetection.service.js";
import { normalizeRowsForFile, toMovementDocument } from "./Normalization.service.js";
import {
  applyManualCategoryEdits,
  applyRuleActions,
  categorizeRows,
  ensureDefaultRules,
  learnRulesFromCategoryEdits
} from "./Categorization.service.js";
import { checkRowsAgainstDatabase } from "./Duplicate.service.js";
import { safeDeleteMany } from "../utils/fileCleanup.js";
import { logger } from "../utils/logger.js";

const getBatchOrThrow = async (batchId) => {
  const batch = await ImportBatch.findById(batchId);
  if (!batch) {
    const error = new Error("Lote de importacion no encontrado");
    error.status = 404;
    throw error;
  }
  return batch;
};

const ensureFileExistsOrThrow = (fileInfo) => {
  if (fileInfo?.filePath && fs.existsSync(fileInfo.filePath)) {
    return;
  }

  const error = new Error(
    `El archivo temporal "${fileInfo?.originalName || "desconocido"}" ya no esta disponible. Reinicia el analisis y vuelve a subir los Excel.`
  );
  error.status = 410;
  throw error;
};

export const createImportBatch = async (files = []) => {
  const mappedFiles = files.map((file) => ({
    fileId: randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    filePath: file.path,
    mimeType: file.mimetype,
    size: file.size
  }));

  const batch = await ImportBatch.create({
    status: "uploaded",
    files: mappedFiles
  });

  logger.info(`[Importacion][Servicio] Lote ${batch._id} creado con ${mappedFiles.length} archivo(s)`);
  return batch;
};

export const detectImportBatch = async (batchId) => {
  const batch = await getBatchOrThrow(batchId);

  const detections = batch.files.map((file) => {
    ensureFileExistsOrThrow(file);
    const detection = analyzeFile(file.filePath);
    return {
      fileId: file.fileId,
      headerRowDetected: detection.headerRowDetected,
      headers: detection.headers,
      possibleColumns: detection.possibleColumns,
      previewRows: detection.previewRows
    };
  });

  const updatedBatch = await ImportBatch.findByIdAndUpdate(
    batchId,
    {
      $set: {
        detections,
        status: "detected"
      }
    },
    { new: true }
  );

  logger.info(`[Importacion][Servicio] Deteccion completada para lote ${batchId}`);
  return updatedBatch.toObject();
};

export const previewMappingForFile = async (batchId, fileConfig) => {
  const batch = await getBatchOrThrow(batchId);
  const fileInfo = batch.files.find((file) => file.fileId === fileConfig.fileId);

  if (!fileInfo) {
    const error = new Error("Archivo no encontrado dentro del lote");
    error.status = 404;
    throw error;
  }

  ensureFileExistsOrThrow(fileInfo);

  const extractedRows = extractRowsWithHeader(fileInfo.filePath, fileConfig.headerRow);
  const output = normalizeRowsForFile({
    rows: extractedRows,
    mapping: fileConfig.mapping,
    origen: fileConfig.origen,
    fileName: fileInfo.originalName,
    fileId: fileInfo.fileId
  });

  return {
    fileId: fileConfig.fileId,
    previewRows: output.normalizedRows.slice(0, 5),
    previewInvalidRows: output.invalidRows.slice(0, 5),
    totalPreviewRows: output.normalizedRows.length,
    totalInvalidRows: output.invalidRows.length
  };
};

export const confirmColumnsForBatch = async (batchId, files = []) => {
  const batch = await getBatchOrThrow(batchId);

  const normalizedRows = [];
  const invalidRows = [];

  files.forEach((config) => {
    const fileInfo = batch.files.find((file) => file.fileId === config.fileId);
    if (!fileInfo) return;
    ensureFileExistsOrThrow(fileInfo);

    const extractedRows = extractRowsWithHeader(fileInfo.filePath, config.headerRow);
    const output = normalizeRowsForFile({
      rows: extractedRows,
      mapping: config.mapping,
      origen: config.origen,
      fileName: fileInfo.originalName,
      fileId: fileInfo.fileId
    });

    normalizedRows.push(...output.normalizedRows);
    invalidRows.push(...output.invalidRows);
  });

  await ImportBatch.findByIdAndUpdate(
    batchId,
    {
      $set: {
        mappings: files,
        normalizedRows,
        invalidRows,
        status: "mapped"
      }
    },
    { new: true }
  );

  logger.info(
    `[Importacion][Servicio] Mapeo confirmado: ${normalizedRows.length} filas validas, ${invalidRows.length} invalidas`
  );

  return {
    normalizedPreview: normalizedRows.slice(0, 100),
    totalNormalized: normalizedRows.length,
    invalidRows
  };
};

export const categorizePreviewForBatch = async (batchId, manualCategoryEdits = []) => {
  const batch = await getBatchOrThrow(batchId);
  await ensureDefaultRules();

  const sourceRows = batch.normalizedRows || [];
  const autoCategorized = await categorizeRows(sourceRows);
  const categorizedRows = applyManualCategoryEdits(autoCategorized, manualCategoryEdits);

  await ImportBatch.findByIdAndUpdate(
    batchId,
    {
      $set: {
        categorizedRows,
        status: "categorized"
      }
    },
    { new: true }
  );

  logger.info(`[Importacion][Servicio] Categorizacion previa completada (${categorizedRows.length} filas)`);

  return {
    categorizedPreview: categorizedRows.slice(0, 200),
    totalCategorized: categorizedRows.length
  };
};

export const checkDuplicatesForBatch = async (batchId) => {
  const batch = await getBatchOrThrow(batchId);
  const rows = (batch.categorizedRows && batch.categorizedRows.length)
    ? batch.categorizedRows
    : batch.normalizedRows;

  const { nonConflicts, conflicts } = await checkRowsAgainstDatabase(rows || []);

  await ImportBatch.findByIdAndUpdate(
    batchId,
    {
      $set: {
        nonConflictRows: nonConflicts,
        conflictRows: conflicts,
        status: "duplicates_checked"
      }
    },
    { new: true }
  );

  logger.info(
    `[Importacion][Servicio] Duplicados revisados: ${conflicts.length} conflictos, ${nonConflicts.length} sin conflicto`
  );

  return {
    nonConflicts,
    conflicts
  };
};

export const commitBatch = async (
  batchId,
  { categoryEdits = [], ruleActions = [], conflictResolutions = [] }
) => {
  const batch = await getBatchOrThrow(batchId);

  const sourceRows = (batch.categorizedRows && batch.categorizedRows.length)
    ? batch.categorizedRows
    : batch.normalizedRows;

  if (!sourceRows || !sourceRows.length) {
    const error = new Error("No hay filas disponibles para guardar");
    error.status = 400;
    throw error;
  }

  const rowsWithCategoryEdits = applyManualCategoryEdits(sourceRows, categoryEdits);

  await applyRuleActions(ruleActions);
  await learnRulesFromCategoryEdits(rowsWithCategoryEdits, categoryEdits);

  const { nonConflicts, conflicts } = await checkRowsAgainstDatabase(rowsWithCategoryEdits);
  const resolutionMap = new Map((conflictResolutions || []).map((entry) => [entry.conflictKey, entry.action]));

  let inserted = 0;
  let replaced = 0;
  let keptExisting = 0;
  let keptBoth = 0;

  if (nonConflicts.length) {
    const docs = nonConflicts.map((row) => toMovementDocument(row));
    const insertedRows = await Movement.insertMany(docs, { ordered: false });
    inserted += insertedRows.length;
  }

  for (const conflict of conflicts) {
    const action = resolutionMap.get(conflict.conflictKey) || conflict.defaultAction;
    const incomingDoc = toMovementDocument(conflict.incomingRow);

    if (action === "replace") {
      const existing = conflict.existingRows[0];
      if (existing) {
        await Movement.findByIdAndUpdate(existing._id, incomingDoc);
        replaced += 1;
      } else {
        await Movement.create(incomingDoc);
        inserted += 1;
      }
      continue;
    }

    if (action === "keep_both") {
      await Movement.create(incomingDoc);
      keptBoth += 1;
      continue;
    }

    keptExisting += 1;
  }

  const summary = {
    inserted,
    replaced,
    keptExisting,
    keptBoth,
    totalProcessed: rowsWithCategoryEdits.length
  };

  await ImportBatch.findByIdAndUpdate(
    batchId,
    {
      $set: {
        status: "committed",
        commitSummary: summary
      }
    },
    { new: true }
  );

  await safeDeleteMany(batch.files.map((file) => file.filePath));

  logger.info(`[Importacion][Servicio] Lote ${batchId} guardado`, summary);
  return summary;
};

export const getBatch = async (batchId) => {
  const batch = await getBatchOrThrow(batchId);
  return batch.toObject();
};
