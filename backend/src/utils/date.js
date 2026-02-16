// Archivo: backend\src\utils\date.js. Codigo y comentarios en espanol.
const MONTH_MAP = {
  ene: "01",
  feb: "02",
  mar: "03",
  abr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  ago: "08",
  sep: "09",
  sept: "09",
  oct: "10",
  nov: "11",
  dic: "12"
};

export const toISODate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const parseDateValue = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const excelSerial = Number(raw);
  if (Number.isFinite(excelSerial) && excelSerial > 1000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + excelSerial);
    return epoch;
  }

  const normalizedText = raw
    .toLowerCase()
    .replace(/\./g, "/")
    .replace(/-/g, "/")
    .replace(/\s+/g, "")
    .replace(/[a-z]+/g, (word) => MONTH_MAP[word] || word);

  const yyyyMmDd = /^\d{4}\/\d{1,2}\/\d{1,2}$/;
  const ddMmYy = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;

  if (yyyyMmDd.test(normalizedText)) {
    const direct = new Date(normalizedText);
    return Number.isNaN(direct.getTime()) ? null : direct;
  }

  if (ddMmYy.test(normalizedText)) {
    const [dd, mm, yy] = normalizedText.split("/");
    const year = yy.length === 2 ? `20${yy}` : yy;
    const iso = `${year}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    const date = new Date(`${iso}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};
