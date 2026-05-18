// Flujo completo del wizard de importacion sobre un XLSX sintetico BBVA.
//
// Pasos:
//   1. POST   /api/import/upload                 (multipart con un .xlsx)
//   2. GET    /api/import/:batchId/detect        -> deteccion automatica
//   3. POST   /api/import/:batchId/confirm-columns
//   4. POST   /api/import/:batchId/categorize-preview
//   5. POST   /api/import/:batchId/check-duplicates
//   6. POST   /api/import/:batchId/commit        -> persiste movimientos
//
// La fixture genera un XLSX en memoria; supertest lo envia como attachment
// sin necesidad de tocar disco mas alla de uploads/, que limpiamos al
// final. Lo importante: probar que el contrato sobrevive a un flujo real.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startMongo, stopMongo, clearCollections } from "../helpers/mongo.js";
import { buildAgent } from "../helpers/server.js";
import { buildBbvaXlsx } from "../fixtures/buildBbvaXlsx.js";
import Movement from "../../src/models/Movement.model.js";

// uploads/ esta en cwd del proceso (backend/), donde npm test lo ejecuta.
const uploadsDir = path.resolve(process.cwd(), "uploads");

beforeAll(async () => {
  await startMongo();
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
});

afterAll(async () => {
  await stopMongo();
});

beforeEach(async () => {
  await clearCollections();
});

describe("Flujo de importacion BBVA end-to-end", () => {
  it("uploads -> detect -> confirm -> categorize -> check-dup -> commit", async () => {
    const agent = buildAgent();
    const buffer = buildBbvaXlsx();

    // 1) Upload
    const uploadRes = await agent
      .post("/api/import/upload")
      .attach("files", buffer, { filename: "bbva-test.xlsx", contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.batchId).toBeDefined();
    expect(uploadRes.body.files).toHaveLength(1);

    const batchId = uploadRes.body.batchId;
    const fileId = uploadRes.body.files[0].fileId;

    // 2) Detect
    const detectRes = await agent.get(`/api/import/${batchId}/detect`);
    expect(detectRes.status).toBe(200);
    expect(detectRes.body.detections).toHaveLength(1);
    const detection = detectRes.body.detections[0];
    expect(detection.headerRowDetected).toBe(4);
    expect(detection.possibleColumns.fecha).toBe("Fecha Operacion");
    expect(detection.possibleColumns.importe).toBe("Importe");

    // 3) Confirm columns
    const confirmRes = await agent
      .post(`/api/import/${batchId}/confirm-columns`)
      .send({
        files: [
          {
            fileId,
            headerRow: 4,
            mapping: {
              fecha: "Fecha Operacion",
              concepto: "Tipo Movimiento",
              importe: "Importe"
            },
            origen: "tarjeta"
          }
        ]
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.totalNormalized).toBe(6);
    expect(confirmRes.body.invalidRows).toEqual([]);

    // 4) Categorize preview
    const catRes = await agent
      .post(`/api/import/${batchId}/categorize-preview`)
      .send({ manualCategoryEdits: [] });

    expect(catRes.status).toBe(200);
    expect(catRes.body.totalCategorized).toBe(6);
    const mercadonaRow = catRes.body.categorizedPreview.find((r) => r.concepto.includes("MERCADONA"));
    expect(mercadonaRow.categoria).toBe("Comida");

    // 5) Check duplicates (BBDD vacia -> todos nonConflicts)
    const dupRes = await agent.post(`/api/import/${batchId}/check-duplicates`);
    expect(dupRes.status).toBe(200);
    expect(dupRes.body.nonConflicts).toHaveLength(6);
    expect(dupRes.body.conflicts).toHaveLength(0);

    // 6) Commit
    const commitRes = await agent
      .post(`/api/import/${batchId}/commit`)
      .send({ categoryEdits: [], ruleActions: [], conflictResolutions: [] });

    expect(commitRes.status).toBe(200);
    expect(commitRes.body.inserted).toBe(6);
    expect(commitRes.body.totalProcessed).toBe(6);

    // Persistencia real en Mongo.
    const stored = await Movement.find().lean();
    expect(stored).toHaveLength(6);
  });

  it("commit reimportando el mismo Excel mantiene 6 movimientos (keep_existing por defecto)", async () => {
    const agent = buildAgent();

    // Primer ciclo completo
    const buffer = buildBbvaXlsx();
    let upload = await agent.post("/api/import/upload").attach("files", buffer, "bbva.xlsx");
    let batchId = upload.body.batchId;
    let fileId = upload.body.files[0].fileId;
    await agent.get(`/api/import/${batchId}/detect`);
    await agent.post(`/api/import/${batchId}/confirm-columns`).send({
      files: [{ fileId, headerRow: 4, mapping: { fecha: "Fecha Operacion", concepto: "Tipo Movimiento", importe: "Importe" }, origen: "tarjeta" }]
    });
    await agent.post(`/api/import/${batchId}/categorize-preview`).send({});
    await agent.post(`/api/import/${batchId}/check-duplicates`);
    await agent.post(`/api/import/${batchId}/commit`).send({});

    // Segundo ciclo: mismo contenido.
    const buffer2 = buildBbvaXlsx();
    upload = await agent.post("/api/import/upload").attach("files", buffer2, "bbva-2.xlsx");
    batchId = upload.body.batchId;
    fileId = upload.body.files[0].fileId;
    await agent.get(`/api/import/${batchId}/detect`);
    await agent.post(`/api/import/${batchId}/confirm-columns`).send({
      files: [{ fileId, headerRow: 4, mapping: { fecha: "Fecha Operacion", concepto: "Tipo Movimiento", importe: "Importe" }, origen: "tarjeta" }]
    });
    await agent.post(`/api/import/${batchId}/categorize-preview`).send({});
    const dup = await agent.post(`/api/import/${batchId}/check-duplicates`);
    // Todos en conflicto, todos con defaultAction keep_existing.
    expect(dup.body.conflicts).toHaveLength(6);
    dup.body.conflicts.forEach((c) => expect(c.defaultAction).toBe("keep_existing"));

    const commit2 = await agent.post(`/api/import/${batchId}/commit`).send({});
    expect(commit2.body.keptExisting).toBe(6);
    expect(commit2.body.inserted).toBe(0);

    const total = await Movement.countDocuments();
    expect(total).toBe(6);
  });

  it("upload sin archivos devuelve 400", async () => {
    const agent = buildAgent();
    const res = await agent.post("/api/import/upload");
    expect(res.status).toBe(400);
  });

  it("confirm-columns con files vacio devuelve 400", async () => {
    const agent = buildAgent();
    const buffer = buildBbvaXlsx();
    const upload = await agent.post("/api/import/upload").attach("files", buffer, "x.xlsx");
    const batchId = upload.body.batchId;

    const res = await agent.post(`/api/import/${batchId}/confirm-columns`).send({ files: [] });
    expect(res.status).toBe(400);
  });
});
