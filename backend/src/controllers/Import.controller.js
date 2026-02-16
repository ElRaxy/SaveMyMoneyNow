// Controlador del flujo de importacion en modo asistente.
import {
  checkDuplicatesForBatch,
  commitBatch,
  confirmColumnsForBatch,
  createImportBatch,
  detectImportBatch,
  categorizePreviewForBatch,
  getBatch,
  previewMappingForFile
} from "../services/Import.service.js";
import { logger } from "../utils/logger.js";

export const uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) {
      return res.status(400).json({ message: "Debes subir al menos un archivo Excel" });
    }

    logger.info(`[Importacion] Subiendo ${req.files.length} archivo(s)`);
    const batch = await createImportBatch(req.files);

    return res.status(201).json({
      batchId: batch._id,
      files: batch.files.map((file) => ({
        fileId: file.fileId,
        fileName: file.originalName,
        status: "uploaded"
      }))
    });
  } catch (error) {
    return next(error);
  }
};

export const detectBatch = async (req, res, next) => {
  try {
    logger.info(`[Importacion] Detectando columnas del lote ${req.params.batchId}`);
    const batch = await detectImportBatch(req.params.batchId);
    return res.json({
      batchId: batch._id,
      files: batch.files,
      detections: batch.detections
    });
  } catch (error) {
    return next(error);
  }
};

export const confirmColumns = async (req, res, next) => {
  try {
    const payload = req.body?.files;
    logger.info(`[Importacion] Confirmando mapeo de columnas para ${req.params.batchId}`);
    const result = await confirmColumnsForBatch(req.params.batchId, payload || []);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const previewMapping = async (req, res, next) => {
  try {
    logger.info(`[Importacion] Previsualizando mapeo de archivo ${req.body?.fileId || "-"}`);
    const result = await previewMappingForFile(req.params.batchId, req.body || {});
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const categorizePreview = async (req, res, next) => {
  try {
    const edits = req.body?.manualCategoryEdits || [];
    logger.info(`[Importacion] Generando previsualizacion categorizada (${edits.length} ediciones)`);
    const result = await categorizePreviewForBatch(req.params.batchId, edits);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const checkDuplicates = async (req, res, next) => {
  try {
    logger.info(`[Importacion] Comprobando duplicados para ${req.params.batchId}`);
    const result = await checkDuplicatesForBatch(req.params.batchId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const commitImport = async (req, res, next) => {
  try {
    logger.info(`[Importacion] Confirmando guardado final para ${req.params.batchId}`);
    const result = await commitBatch(req.params.batchId, {
      categoryEdits: req.body?.categoryEdits || [],
      ruleActions: req.body?.ruleActions || [],
      conflictResolutions: req.body?.conflictResolutions || []
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

export const getImportBatch = async (req, res, next) => {
  try {
    const batch = await getBatch(req.params.batchId);
    return res.json(batch);
  } catch (error) {
    return next(error);
  }
};
