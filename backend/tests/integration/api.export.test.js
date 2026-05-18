// Tests de los endpoints de exportacion.
//
// Verificamos:
//   - status 200
//   - Content-Type correcto (xlsx / pdf)
//   - tamaño > 0
//
// No validamos el contenido binario (no es el scope); confiamos en que las
// librerias ExcelJS / pdfkit generan un fichero correcto si reciben filas
// validas.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startMongo, stopMongo, clearCollections } from "../helpers/mongo.js";
import { buildAgent } from "../helpers/server.js";
import Movement from "../../src/models/Movement.model.js";

const seedMovements = async () => {
  await Movement.insertMany([
    {
      fecha: new Date("2025-09-17T00:00:00.000Z"),
      concepto: "MERCADONA",
      importe: -45.15,
      origen: "tarjeta",
      categoria: "Comida",
      archivo: "bbva.xlsx",
      fingerprintKey: "2025-09-17|mercadona",
      exactKey: "2025-09-17|mercadona|-45.15"
    },
    {
      fecha: new Date("2025-09-18T00:00:00.000Z"),
      concepto: "Nomina",
      importe: 1500,
      origen: "cuenta",
      categoria: "Salario",
      archivo: "bbva.xlsx",
      fingerprintKey: "2025-09-18|nomina",
      exactKey: "2025-09-18|nomina|1500"
    }
  ]);
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

describe("GET /api/export/movements.xlsx", () => {
  it("devuelve 200, content-type xlsx y body no vacio", async () => {
    await seedMovements();
    const agent = buildAgent();
    const response = await agent.get("/api/export/movements.xlsx").buffer().parse((res, cb) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => cb(null, Buffer.concat(chunks)));
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("spreadsheetml.sheet");
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("funciona con 0 movimientos (devuelve un xlsx vacio)", async () => {
    const agent = buildAgent();
    const response = await agent.get("/api/export/movements.xlsx").buffer().parse((res, cb) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => cb(null, Buffer.concat(chunks)));
    });

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });
});

describe("GET /api/export/movements.pdf", () => {
  it("devuelve 200, content-type pdf y body no vacio", async () => {
    await seedMovements();
    const agent = buildAgent();
    const response = await agent.get("/api/export/movements.pdf").buffer().parse((res, cb) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => cb(null, Buffer.concat(chunks)));
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/pdf");
    expect(response.body.length).toBeGreaterThan(0);
    // PDF debe empezar con la firma "%PDF"
    expect(response.body.slice(0, 4).toString()).toBe("%PDF");
  });
});
