// Archivo: backend\src\services\Dashboard.service.js. Codigo y comentarios en espanol.
import Movement from "../models/Movement.model.js";
import { getMovementFilters } from "./Movement.service.js";

const toPeriodExpression = (granularity) => {
  switch (granularity) {
    case "day":
      return { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } };
    case "week":
      return {
        $concat: [
          { $toString: { $isoWeekYear: "$fecha" } },
          "-W",
          {
            $toString: {
              $cond: [
                { $lt: [{ $isoWeek: "$fecha" }, 10] },
                { $concat: ["0", { $toString: { $isoWeek: "$fecha" } }] },
                { $toString: { $isoWeek: "$fecha" } }
              ]
            }
          }
        ]
      };
    case "year":
      return { $dateToString: { format: "%Y", date: "$fecha" } };
    case "month":
    default:
      return { $dateToString: { format: "%Y-%m", date: "$fecha" } };
  }
};

export const getExpenseByCategory = async (filters = {}) => {
  const match = {
    ...getMovementFilters(filters),
    importe: { $lt: 0 }
  };

  return Movement.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$categoria",
        total: { $sum: { $multiply: ["$importe", -1] } }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

export const getMonthlyExpense = async (filters = {}) => {
  const match = {
    ...getMovementFilters(filters),
    importe: { $lt: 0 }
  };

  return Movement.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$fecha" } },
        total: { $sum: { $multiply: ["$importe", -1] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

export const getTrend = async (filters = {}) => {
  const match = getMovementFilters(filters);
  return Movement.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$fecha" } },
        neto: { $sum: "$importe" },
        gastos: {
          $sum: {
            $cond: [{ $lt: ["$importe", 0] }, { $multiply: ["$importe", -1] }, 0]
          }
        },
        ingresos: {
          $sum: {
            $cond: [{ $gte: ["$importe", 0] }, "$importe", 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

export const getComparison = async (filters = {}, granularity = "month") => {
  const match = getMovementFilters(filters);
  const period = toPeriodExpression(granularity);

  return Movement.aggregate([
    { $match: match },
    {
      $group: {
        _id: period,
        gastos: {
          $sum: {
            $cond: [{ $lt: ["$importe", 0] }, { $multiply: ["$importe", -1] }, 0]
          }
        },
        ingresos: {
          $sum: {
            $cond: [{ $gte: ["$importe", 0] }, "$importe", 0]
          }
        },
        neto: { $sum: "$importe" }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};
