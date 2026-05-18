// Archivo: backend\src\routes\movement.routes.js. Codigo y comentarios en espanol.
import { Router } from "express";
import {
  getMovements,
  updateMovement,
  deleteMovement
} from "../controllers/Movement.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import { validateUpdateMovementBody } from "../validators/movementValidators.js";

const router = Router();

router.get("/", getMovements);
router.patch("/:id", validateRequest(validateUpdateMovementBody), updateMovement);
router.delete("/:id", deleteMovement);

export default router;
