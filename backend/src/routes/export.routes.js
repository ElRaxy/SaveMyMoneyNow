// Archivo: backend\src\routes\export.routes.js. Codigo y comentarios en espanol.
import { Router } from "express";
import { exportExcel, exportPdf } from "../controllers/Export.controller.js";

const router = Router();

router.get("/movements.xlsx", exportExcel);
router.get("/movements.pdf", exportPdf);

export default router;
