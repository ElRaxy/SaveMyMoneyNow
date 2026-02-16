// Archivo: frontend\src\services\importApi.js. Codigo y comentarios en espanol.
import apiClient from "./apiClient";

export const uploadFiles = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const { data } = await apiClient.post("/import/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

  return data;
};

export const detectBatch = async (batchId) => {
  const { data } = await apiClient.get(`/import/${batchId}/detect`);
  return data;
};

export const confirmColumns = async (batchId, files) => {
  const { data } = await apiClient.post(`/import/${batchId}/confirm-columns`, { files });
  return data;
};

export const previewMapping = async (batchId, fileConfig) => {
  const { data } = await apiClient.post(`/import/${batchId}/preview-mapping`, fileConfig);
  return data;
};

export const categorizePreview = async (batchId, manualCategoryEdits = []) => {
  const { data } = await apiClient.post(`/import/${batchId}/categorize-preview`, { manualCategoryEdits });
  return data;
};

export const checkDuplicates = async (batchId) => {
  const { data } = await apiClient.post(`/import/${batchId}/check-duplicates`);
  return data;
};

export const commitBatch = async (batchId, payload) => {
  const { data } = await apiClient.post(`/import/${batchId}/commit`, payload);
  return data;
};

export const getBatch = async (batchId) => {
  const { data } = await apiClient.get(`/import/${batchId}`);
  return data;
};
