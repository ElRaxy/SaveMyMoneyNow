// Archivo: backend\src\middlewares\uploadMiddleware.js. Codigo y comentarios en espanol.
import path from "path";
import multer from "multer";

const buildReadableTimestamp = () => {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const ms = String(now.getMilliseconds()).padStart(3, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}-${ms}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^\w.-]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
    const timestamp = buildReadableTimestamp();
    cb(null, `${base || "archivo"}__${timestamp}${ext.toLowerCase()}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".xls" || ext === ".xlsx") {
    cb(null, true);
    return;
  }
  cb(new Error("Solo se permiten archivos Excel (.xls o .xlsx)"));
};

export const uploadExcelFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 20
  }
});
