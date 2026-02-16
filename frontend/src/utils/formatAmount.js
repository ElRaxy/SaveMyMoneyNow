// Archivo: frontend\src\utils\formatAmount.js. Codigo y comentarios en espanol.
export const formatAmount = (value) => {
  const number = Number(value || 0);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR"
  }).format(number);
};
