// Tests de integracion para GET /api/movements.
//
// Cubre filtros (origen, categoria, search), paginacion y el bloque summary
// (totales agregados). Insertamos los documentos directamente con el modelo
// para no depender del flujo de importacion: aqui solo nos interesa la
// query.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startMongo, stopMongo, clearCollections } from "../helpers/mongo.js";
import { buildAgent } from "../helpers/server.js";
import Movement from "../../src/models/Movement.model.js";

const seedMovements = async () => {
  const docs = [
    {
      fecha: new Date("2025-09-17T00:00:00.000Z"),
      concepto: "MERCADONA Centro",
      importe: -45.15,
      origen: "tarjeta",
      categoria: "Comida",
      archivo: "bbva.xlsx",
      fingerprintKey: "2025-09-17|mercadona centro",
      exactKey: "2025-09-17|mercadona centro|-45.15"
    },
    {
      fecha: new Date("2025-09-18T00:00:00.000Z"),
      concepto: "Nomina Empresa",
      importe: 1500,
      origen: "cuenta",
      categoria: "Salario",
      archivo: "bbva.xlsx",
      fingerprintKey: "2025-09-18|nomina empresa",
      exactKey: "2025-09-18|nomina empresa|1500"
    },
    {
      fecha: new Date("2025-09-19T00:00:00.000Z"),
      concepto: "Repsol",
      importe: -55.3,
      origen: "tarjeta",
      categoria: "Gasolina",
      archivo: "bbva.xlsx",
      fingerprintKey: "2025-09-19|repsol",
      exactKey: "2025-09-19|repsol|-55.3"
    }
  ];
  await Movement.insertMany(docs);
};

beforeAll(async () => {
  await startMongo();
});

afterAll(async () => {
  await stopMongo();
});

beforeEach(async () => {
  await clearCollections();
});

describe("GET /api/movements", () => {
  it("devuelve filas, pagination y summary", async () => {
    await seedMovements();
    const agent = buildAgent();
    const response = await agent.get("/api/movements");

    expect(response.status).toBe(200);
    expect(response.body.rows).toHaveLength(3);
    expect(response.body.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 3,
      totalPages: 1
    });
    // 1500 ingresos, 45.15 + 55.3 = 100.45 gastos, balance = 1399.55.
    expect(response.body.summary.totalIngresos).toBeCloseTo(1500, 2);
    expect(response.body.summary.totalGastos).toBeCloseTo(100.45, 2);
    expect(response.body.summary.balance).toBeCloseTo(1399.55, 2);
  });

  it("filtra por origen=tarjeta", async () => {
    await seedMovements();
    const agent = buildAgent();
    const response = await agent.get("/api/movements?origen=tarjeta");

    expect(response.status).toBe(200);
    expect(response.body.rows).toHaveLength(2);
    response.body.rows.forEach((row) => expect(row.origen).toBe("tarjeta"));
  });

  it("filtra por categoria=Gasolina", async () => {
    await seedMovements();
    const agent = buildAgent();
    const response = await agent.get("/api/movements?categoria=Gasolina");

    expect(response.status).toBe(200);
    expect(response.body.rows).toHaveLength(1);
    expect(response.body.rows[0].concepto).toBe("Repsol");
  });

  it("filtra por search (regex case-insensitive sobre concepto)", async () => {
    await seedMovements();
    const agent = buildAgent();
    const response = await agent.get("/api/movements?search=mercadona");

    expect(response.status).toBe(200);
    expect(response.body.rows).toHaveLength(1);
    expect(response.body.rows[0].concepto).toContain("MERCADONA");
  });

  it("paginacion: limit=2 devuelve 2 filas y totalPages=2", async () => {
    await seedMovements();
    const agent = buildAgent();
    const response = await agent.get("/api/movements?limit=2&page=1");

    expect(response.body.rows).toHaveLength(2);
    expect(response.body.pagination.total).toBe(3);
    expect(response.body.pagination.totalPages).toBe(2);
  });
});

describe("PATCH /api/movements/:id", () => {
  it("actualiza campos permitidos y recalcula fingerprintKey", async () => {
    await seedMovements();
    const created = await Movement.findOne({ concepto: "Repsol" }).lean();
    const agent = buildAgent();

    const response = await agent
      .patch(`/api/movements/${created._id}`)
      .send({ categoria: "Transporte", concepto: "Repsol Norte" });

    expect(response.status).toBe(200);
    expect(response.body.categoria).toBe("Transporte");
    expect(response.body.concepto).toBe("Repsol Norte");
    // El fingerprintKey debe haberse recalculado con el nuevo concepto.
    expect(response.body.fingerprintKey).toContain("repsol norte");
  });

  it("rechaza body con campo no editable", async () => {
    await seedMovements();
    const created = await Movement.findOne().lean();
    const agent = buildAgent();

    const response = await agent
      .patch(`/api/movements/${created._id}`)
      .send({ fingerprintKey: "manipulado" });

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/movements/:id", () => {
  it("elimina y devuelve 204", async () => {
    await seedMovements();
    const created = await Movement.findOne().lean();
    const agent = buildAgent();

    const response = await agent.delete(`/api/movements/${created._id}`);
    expect(response.status).toBe(204);

    const stillThere = await Movement.findById(created._id).lean();
    expect(stillThere).toBeNull();
  });

  it("devuelve 404 cuando el id no existe", async () => {
    const agent = buildAgent();
    const response = await agent.delete("/api/movements/507f1f77bcf86cd799439011");
    expect(response.status).toBe(404);
  });
});
