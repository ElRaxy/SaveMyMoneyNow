// Archivo: backend/src/utils/amount.js. Codigo y comentarios en espanol.
export const parseAmountValue = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;

  const raw = String(value ?? "").trim();
  if (!raw) return NaN;

  const clean = raw
    .replace(/[€$£¥\s]/g, "")
    .replace(/\?$/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.-]/g, "");

  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : NaN;
};
