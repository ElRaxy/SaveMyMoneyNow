// Archivo: frontend\src\services\ruleApi.js. Codigo y comentarios en espanol.
import apiClient from "./apiClient";

export const getRules = async () => {
  const { data } = await apiClient.get("/rules");
  return data;
};

export const createRule = async (payload) => {
  const { data } = await apiClient.post("/rules", payload);
  return data;
};

export const updateRule = async (id, payload) => {
  const { data } = await apiClient.put(`/rules/${id}`, payload);
  return data;
};

export const deleteRule = async (id) => {
  await apiClient.delete(`/rules/${id}`);
};
