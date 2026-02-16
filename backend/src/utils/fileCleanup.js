// Archivo: backend\src\utils\fileCleanup.js. Codigo y comentarios en espanol.
import fs from "fs/promises";

export const safeDeleteFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore cleanup errors for temp files.
  }
};

export const safeDeleteMany = async (paths) => {
  await Promise.all((paths || []).map((filePath) => safeDeleteFile(filePath)));
};
