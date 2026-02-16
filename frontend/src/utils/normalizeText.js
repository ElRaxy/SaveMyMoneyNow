// Archivo: frontend\src\utils\normalizeText.js. Codigo y comentarios en espanol.
export const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
