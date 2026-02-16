// Archivo: backend\src\routes\movement.routes.js. Codigo y comentarios en espanol.
import { Router } from "express";
import { getMovements } from "../controllers/Movement.controller.js";

const router = Router();

router.get("/", getMovements);

export default router;
