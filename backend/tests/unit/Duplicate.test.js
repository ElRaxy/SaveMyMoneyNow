// Tests de Duplicate.service.checkRowsAgainstDatabase.
//
// La heuristica esta documentada en el head del servicio. Resumen:
//   - Sin existing -> nonConflicts.
//   - Con existing mismo importe -> defaultAction "keep_existing".
//   - Con existing distinto importe -> "keep_both".
//   - Con varios existing donde uno coincide en importe -> "keep_existing".
//
// Necesita Mongo real (queries con $in + .lean()), asi que usamos
// mongodb-memory-server.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startMongo, stopMongo, clearCollections } from "../helpers/mongo.js";
import Movement from "../../src/models/Movement.model.js";
import { checkRowsAgainstDatabase } from "../../src/services/Duplicate.service.js";

const fechaIso = "2025-09-17T00:00:00.000Z";
const fecha = new Date(fechaIso);

const buildIncoming = (overrides = {}) => ({
  tempId: "f1-1",
  fileId: "f1",
  fecha: fechaIso,
  concepto: "MERCADONA",
  importe: -45.15,
  origen: "tarjeta",
  archivo: "bbva.xlsx",
  categoria: "Comida",
  fingerprintKey: "2025-09-17|mercadona",
  exactKey: "2025-09-17|mercadona|-45.15",
  ...overrides
});

const buildExisting = (overrides = {}) =>
  Movement.create({
    fecha,
    concepto: "MERCADONA",
    importe: -45.15,
    origen: "tarjeta",
    archivo: "bbva.xlsx",
    categoria: "Comida",
    fingerprintKey: "2025-09-17|mercadona",
    exactKey: "2025-09-17|mercadona|-45.15",
    ...overrides
  });

beforeAll(async () => {
  await startMongo();
});

afterAll(async () => {
  await stopMongo();
});

beforeEach(async () => {
  await clearCollections();
});

describe("checkRowsAgainstDatabase", () => {
  it("array vacio -> nonConflicts y conflicts vacios", async () => {
    const result = await checkRowsAgainstDatabase([]);
    expect(result.nonConflicts).toEqual([]);
    expect(result.conflicts).toEqual([]);
  });

  it("sin existing en BBDD -> todas las filas son nonConflicts", async () => {
    const incoming = buildIncoming();
    const result = await checkRowsAgainstDatabase([incoming]);
    expect(result.nonConflicts).toHaveLength(1);
    expect(result.conflicts).toHaveLength(0);
  });

  it("existing con MISMO importe -> defaultAction 'keep_existing'", async () => {
    await buildExisting();
    const result = await checkRowsAgainstDatabase([buildIncoming()]);
    expect(result.nonConflicts).toHaveLength(0);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].defaultAction).toBe("keep_existing");
  });

  it("existing con DISTINTO importe -> defaultAction 'keep_both'", async () => {
    await buildExisting({ importe: -30.0, exactKey: "2025-09-17|mercadona|-30" });
    const result = await checkRowsAgainstDatabase([buildIncoming()]);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].defaultAction).toBe("keep_both");
  });

  it("varios existing donde UNO coincide en importe -> 'keep_existing'", async () => {
    await buildExisting({ importe: -10, exactKey: "2025-09-17|mercadona|-10" });
    await buildExisting({ importe: -45.15, exactKey: "2025-09-17|mercadona|-45.15" });
    await buildExisting({ importe: -77.5, exactKey: "2025-09-17|mercadona|-77.5" });

    const result = await checkRowsAgainstDatabase([buildIncoming()]);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].defaultAction).toBe("keep_existing");
    // El servicio devuelve TODOS los existing para que el frontend de
    // contexto al usuario.
    expect(result.conflicts[0].existingRows).toHaveLength(3);
  });

  it("conflict expone conflictKey = tempId de la fila entrante", async () => {
    await buildExisting();
    const incoming = buildIncoming({ tempId: "lote-7" });
    const result = await checkRowsAgainstDatabase([incoming]);
    expect(result.conflicts[0].conflictKey).toBe("lote-7");
  });
});
