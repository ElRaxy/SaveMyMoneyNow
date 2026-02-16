// Archivo: frontend\src\utils\formatDate.js. Codigo y comentarios en espanol.
export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-ES");
};
