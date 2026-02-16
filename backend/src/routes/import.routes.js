// Archivo: backend\src\routes\import.routes.js. Codigo y comentarios en espanol.
import { Router } from "express";
import {
  categorizePreview,
  checkDuplicates,
  commitImport,
  confirmColumns,
  detectBatch,
  getImportBatch,
  previewMapping,
  uploadFiles
} from "../controllers/Import.controller.js";
import { uploadExcelFiles } from "../middlewares/uploadMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { validateCommitBody, validateConfirmColumnsBody, validatePreviewMappingBody } from "../validators/importValidators.js";

const router = Router();

router.post("/upload", uploadExcelFiles.array("files", 20), uploadFiles);
router.get("/:batchId", getImportBatch);
router.get("/:batchId/detect", detectBatch);
router.post("/:batchId/confirm-columns", validateRequest(validateConfirmColumnsBody), confirmColumns);
router.post("/:batchId/preview-mapping", validateRequest(validatePreviewMappingBody), previewMapping);
router.post("/:batchId/categorize-preview", categorizePreview);
router.post("/:batchId/check-duplicates", checkDuplicates);
router.post("/:batchId/commit", validateRequest(validateCommitBody), commitImport);

export default router;
