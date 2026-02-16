// Archivo: frontend\src\services\movementApi.js. Codigo y comentarios en espanol.
import apiClient from "./apiClient";

export const getMovements = async (params = {}) => {
  const { data } = await apiClient.get("/movements", { params });
  return data;
};
