// Archivo: frontend\src\services\dashboardApi.js. Codigo y comentarios en espanol.
import apiClient from "./apiClient";

export const getByCategory = async (params = {}) => {
  const { data } = await apiClient.get("/dashboard/by-category", { params });
  return data;
};

export const getMonthlyExpense = async (params = {}) => {
  const { data } = await apiClient.get("/dashboard/monthly-expense", { params });
  return data;
};

export const getTrend = async (params = {}) => {
  const { data } = await apiClient.get("/dashboard/trend", { params });
  return data;
};

export const getComparison = async (params = {}) => {
  const { data } = await apiClient.get("/dashboard/comparison", { params });
  return data;
};
