// Archivo: frontend\src\services\movementApi.js. Codigo y comentarios en espanol.
import apiClient from "./apiClient";

export const getMovements = async (params = {}) => {
  const { data } = await apiClient.get("/movements", { params });
  return data;
};

// PATCH /api/movements/:id
//
// POR QUE PATCH y no PUT:
//   El usuario edita solo los campos que cambian (concepto, importe, categoria,
//   origen). PUT exigiria reenviar el recurso completo y borrar fields no
//   incluidos. PATCH expresa "parche parcial" y deja al backend responsabilidad
//   de validar cada campo individualmente.
export const updateMovement = async (id, patch) => {
  const { data } = await apiClient.patch(`/movements/${id}`, patch);
  return data;
};

// DELETE /api/movements/:id
// Devuelve 204 (sin cuerpo). Resolvemos a true para uso conveniente en la UI.
export const deleteMovement = async (id) => {
  await apiClient.delete(`/movements/${id}`);
  return true;
};
