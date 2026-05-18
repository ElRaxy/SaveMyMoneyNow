// CRUD completo de reglas de categorizacion.
//
// `listRules` invoca `ensureDefaultRules` que upsertea reglas semilla
// (Mercadona, Repsol, Netflix, etc.) en la BBDD. Por eso, tras el primer
// GET, la coleccion ya contiene ~8 reglas, y los tests deben tenerlo en
// cuenta cuando cuentan elementos.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startMongo, stopMongo, clearCollections } from "../helpers/mongo.js";
import { buildAgent } from "../helpers/server.js";

beforeAll(async () => {
  await startMongo();
});

afterAll(async () => {
  await stopMongo();
});

beforeEach(async () => {
  await clearCollections();
});

describe("CRUD /api/rules", () => {
  it("GET / devuelve la lista (al menos las reglas semilla)", async () => {
    const agent = buildAgent();
    const response = await agent.get("/api/rules");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    // ensureDefaultRules insertara 8 reglas semilla la primera vez.
    expect(response.body.length).toBeGreaterThanOrEqual(8);
  });

  it("POST / crea una regla y devuelve 201 con el documento", async () => {
    const agent = buildAgent();
    const response = await agent.post("/api/rules").send({
      keyword: "amazon",
      categoria: "Compras online",
      priority: 50
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      keyword: "amazon",
      categoria: "Compras online",
      priority: 50,
      active: true
    });
    expect(response.body._id).toBeDefined();
  });

  it("PUT /:id actualiza una regla existente", async () => {
    const agent = buildAgent();
    const created = await agent.post("/api/rules").send({
      keyword: "uber",
      categoria: "Transporte",
      priority: 50
    });

    const response = await agent
      .put(`/api/rules/${created.body._id}`)
      .send({ categoria: "Movilidad", priority: 30 });

    expect(response.status).toBe(200);
    expect(response.body.categoria).toBe("Movilidad");
    expect(response.body.priority).toBe(30);
  });

  it("PUT /:id devuelve 404 cuando el id no existe", async () => {
    const agent = buildAgent();
    // ObjectId valido pero inexistente.
    const response = await agent
      .put("/api/rules/507f1f77bcf86cd799439011")
      .send({ categoria: "X" });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });

  it("DELETE /:id elimina la regla y devuelve 204", async () => {
    const agent = buildAgent();
    const created = await agent.post("/api/rules").send({
      keyword: "ikea",
      categoria: "Hogar",
      priority: 60
    });

    const deleted = await agent.delete(`/api/rules/${created.body._id}`);
    expect(deleted.status).toBe(204);

    const list = await agent.get("/api/rules");
    const ids = list.body.map((r) => r._id);
    expect(ids).not.toContain(created.body._id);
  });
});
