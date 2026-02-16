// Archivo: backend\src\utils\text.js. Codigo y comentarios en espanol.
export const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const normalizeConcept = (value = "") =>
  normalizeText(value)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
