// Archivo: backend\src\validators\filterValidators.js. Codigo y comentarios en espanol.
export const validateGranularityQuery = (req) => {
  const allowed = ["day", "week", "month", "year"];
  const granularity = req.query?.granularity;

  if (!granularity) return null;
  if (!allowed.includes(granularity)) {
    return "granularity debe ser day, week, month o year";
  }

  return null;
};
