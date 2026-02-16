// Controlador de exportaciones en Excel y PDF.
import { createMovementsExcelBuffer, createMovementsPdfBuffer } from "../services/Export.service.js";
import { findMovementsForExport } from "../services/Movement.service.js";
import { logger } from "../utils/logger.js";

export const exportExcel = async (req, res, next) => {
  try {
    logger.info("[Exportacion] Generando archivo Excel");
    const rows = await findMovementsForExport(req.query);
    const buffer = await createMovementsExcelBuffer(rows);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=movimientos.xlsx");
    return res.send(Buffer.from(buffer));
  } catch (error) {
    return next(error);
  }
};

export const exportPdf = async (req, res, next) => {
  try {
    logger.info("[Exportacion] Generando archivo PDF");
    const rows = await findMovementsForExport(req.query);
    const buffer = await createMovementsPdfBuffer(rows);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=movimientos.pdf");
    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
};
