// Archivo: frontend\src\services\exportApi.js. Codigo y comentarios en espanol.
const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });
  return query.toString();
};

export const buildExcelExportUrl = (params = {}) => {
  const query = buildQuery(params);
  return `${apiBase}/export/movements.xlsx${query ? `?${query}` : ""}`;
};

export const buildPdfExportUrl = (params = {}) => {
  const query = buildQuery(params);
  return `${apiBase}/export/movements.pdf${query ? `?${query}` : ""}`;
};
