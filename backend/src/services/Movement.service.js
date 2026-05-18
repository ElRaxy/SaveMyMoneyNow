// Archivo: backend\src\services\Movement.service.js. Codigo y comentarios en espanol.
import Movement from "../models/Movement.model.js";
import { normalizeConcept } from "../utils/text.js";
import { toISODate } from "../utils/date.js";
import { escapeRegExp } from "../utils/regex.js";

// Campos editables aceptados por updateMovementById. Mantenerlos sincronizados
// con la whitelist del validator `validateUpdateMovementBody`.
const ALLOWED_UPDATE_FIELDS = ["concepto", "categoria", "importe", "origen"];

// Helpers locales para reconstruir las claves derivadas. Replicamos la
// formula usada en Normalization.service.js (no la importamos para no
// crear un acoplamiento circular service<->service en el momento del
// import; la formula es trivial y estable).
const buildFingerprintKey = (fecha, concepto) =>
  `${toISODate(fecha)}|${normalizeConcept(concepto)}`;

const buildExactKey = (fecha, concepto, importe) =>
  `${buildFingerprintKey(fecha, concepto)}|${importe}`;

const buildMongoFilters = (filters = {}) => {
  const mongoFilters = {};

  if (filters.from || filters.to) {
    mongoFilters.fecha = {};
    if (filters.from) {
      mongoFilters.fecha.$gte = new Date(`${filters.from}T00:00:00.000Z`);
    }
    if (filters.to) {
      mongoFilters.fecha.$lte = new Date(`${filters.to}T23:59:59.999Z`);
    }
  }

  if (filters.origen) {
    mongoFilters.origen = filters.origen;
  }

  if (filters.categoria) {
    mongoFilters.categoria = filters.categoria;
  }

  // Busqueda libre por concepto.
  //
  // Usamos regex case-insensitive (`$regex` + `$options: "i"`) en vez de un
  // `$text` index porque crear y mantener el index de texto en Mongo queda
  // fuera de scope para esta practica. La regex es "contains" simple sobre
  // un campo que ya tiene index normal (`concepto`), lo que permite a Mongo
  // usar ese index si el termino coincide con un prefijo. Saneamos el input
  // con `escapeRegExp` para que caracteres como `.`, `*`, `(`... se traten
  // como literales y no como metacaracteres (evita ReDoS).
  if (filters.search) {
    const trimmed = String(filters.search).trim();
    if (trimmed) {
      mongoFilters.concepto = { $regex: escapeRegExp(trimmed), $options: "i" };
    }
  }

  return mongoFilters;
};

export const getMovementFilters = buildMongoFilters;

export const listMovements = async (filters = {}, options = {}) => {
  const page = Number(options.page || 1);
  const limit = Number(options.limit || 20);
  const skip = (page - 1) * limit;
  const query = buildMongoFilters(filters);

  const [rows, total, summary] = await Promise.all([
    Movement.find(query).sort({ fecha: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Movement.countDocuments(query),
    Movement.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalIngresos: {
            $sum: {
              $cond: [{ $gte: ["$importe", 0] }, "$importe", 0]
            }
          },
          totalGastos: {
            $sum: {
              $cond: [{ $lt: ["$importe", 0] }, { $multiply: ["$importe", -1] }, 0]
            }
          },
          balance: { $sum: "$importe" }
        }
      }
    ])
  ]);

  return {
    rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    },
    summary: summary[0] || { totalIngresos: 0, totalGastos: 0, balance: 0 }
  };
};

export const findMovementsForExport = async (filters = {}) => {
  // Reusa exactamente el mismo `buildMongoFilters` para que el export
  // respete `search`, `from`, `to`, `origen` y `categoria` igual que el
  // listado paginado. Asi el usuario exporta lo mismo que esta viendo.
  const query = buildMongoFilters(filters);
  return Movement.find(query).sort({ fecha: 1, createdAt: 1 }).lean();
};

// Actualiza un movimiento aplicando solo los campos permitidos. Si cambia
// `concepto` o `importe` se regeneran las claves derivadas
// (`fingerprintKey` y `exactKey`) para que la deteccion de duplicados siga
// siendo consistente: esas claves son funcion pura de (fecha, concepto,
// importe), asi que si no las recalculamos el documento quedaria con una
// huella desincronizada y futuras importaciones podrian no detectar un
// duplicado evidente.
export const updateMovementById = async (id, patch = {}) => {
  const existing = await Movement.findById(id);
  if (!existing) {
    const error = new Error("Movimiento no encontrado");
    error.status = 404;
    throw error;
  }

  // Whitelist defensiva en el servicio (cinturon y tirantes): aunque el
  // validator de la ruta ya filtra, este servicio podria invocarse desde
  // otros lados (tests, scripts) y conviene no confiar.
  const sanitizedPatch = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (patch[field] !== undefined) {
      sanitizedPatch[field] = patch[field];
    }
  }

  if (typeof sanitizedPatch.concepto === "string") {
    sanitizedPatch.concepto = sanitizedPatch.concepto.trim();
  }
  if (typeof sanitizedPatch.categoria === "string") {
    sanitizedPatch.categoria = sanitizedPatch.categoria.trim();
  }

  // Recalculamos huellas solo si cambia algo que afecte a su valor.
  const conceptoChanged =
    sanitizedPatch.concepto !== undefined && sanitizedPatch.concepto !== existing.concepto;
  const importeChanged =
    sanitizedPatch.importe !== undefined && sanitizedPatch.importe !== existing.importe;

  if (conceptoChanged || importeChanged) {
    const nuevoConcepto = sanitizedPatch.concepto ?? existing.concepto;
    const nuevoImporte = sanitizedPatch.importe ?? existing.importe;
    sanitizedPatch.fingerprintKey = buildFingerprintKey(existing.fecha, nuevoConcepto);
    sanitizedPatch.exactKey = buildExactKey(existing.fecha, nuevoConcepto, nuevoImporte);
  }

  const updated = await Movement.findByIdAndUpdate(id, sanitizedPatch, {
    new: true,
    runValidators: true
  }).lean();

  return updated;
};

export const deleteMovementById = async (id) => {
  const result = await Movement.findByIdAndDelete(id).lean();
  if (!result) {
    const error = new Error("Movimiento no encontrado");
    error.status = 404;
    throw error;
  }
  return result;
};
