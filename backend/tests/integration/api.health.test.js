// Smoke test del endpoint de salud.
//
// Es el contrato minimo que cualquier despliegue/loadbalancer usa para
// saber si la API esta viva. Si esto se rompe, fallarian todos los demas
// integration tests, asi que lo dejamos aislado y sin dependencia de Mongo
// (la ruta /api/health no toca BBDD).
import { describe, it, expect } from "vitest";
import { buildAgent } from "../helpers/server.js";

describe("GET /api/health", () => {
  it("devuelve 200 y { status: 'ok' }", async () => {
    const agent = buildAgent();
    const response = await agent.get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("devuelve 404 con JSON para rutas inexistentes", async () => {
    const agent = buildAgent();
    const response = await agent.get("/api/no-existe");

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });
});
