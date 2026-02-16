// Archivo: backend\src\services\Movement.service.js. Codigo y comentarios en espanol.
import Movement from "../models/Movement.model.js";

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
  const query = buildMongoFilters(filters);
  return Movement.find(query).sort({ fecha: 1, createdAt: 1 }).lean();
};
