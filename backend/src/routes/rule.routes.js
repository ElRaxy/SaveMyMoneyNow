// Archivo: backend\src\routes\rule.routes.js. Codigo y comentarios en espanol.
import { Router } from "express";
import { getRules, postRule, putRule, removeRule } from "../controllers/Rule.controller.js";

const router = Router();

router.get("/", getRules);
router.post("/", postRule);
router.put("/:id", putRule);
router.delete("/:id", removeRule);

export default router;
