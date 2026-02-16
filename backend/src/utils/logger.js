// Archivo: backend/src/utils/logger.js. Logger legible con formato estructurado y colores.
import { inspect } from "node:util";

const COLOR_ENABLED = process.stdout.isTTY && process.env.NO_COLOR !== "1";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

const FG = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m"
};

const paint = (value, ansi) => (COLOR_ENABLED ? `${ansi}${value}${RESET}` : value);

const nowLabel = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};

const levelColor = (level) => {
  switch (level) {
    case "OK":
      return FG.green;
    case "WARN":
      return FG.yellow;
    case "ERROR":
      return FG.red;
    case "DEBUG":
      return FG.magenta;
    case "HTTP":
      return FG.blue;
    default:
      return FG.cyan;
  }
};

const methodColor = (method) => {
  switch (method) {
    case "POST":
      return FG.green;
    case "PUT":
    case "PATCH":
      return FG.yellow;
    case "DELETE":
      return FG.red;
    default:
      return FG.cyan;
  }
};

const statusColor = (status) => {
  if (status >= 500) return FG.red;
  if (status >= 400) return FG.yellow;
  if (status >= 300) return FG.magenta;
  return FG.green;
};

const formatMetaItem = (item) => {
  if (typeof item === "string") return item;
  return inspect(item, {
    colors: false,
    depth: 6,
    compact: false,
    breakLength: 100
  });
};

const print = (printer, level, message, meta = []) => {
  const timeLabel = paint(`[${nowLabel()}]`, `${DIM}${FG.white}`);
  const levelLabel = paint(level.padEnd(5), `${BOLD}${levelColor(level)}`);
  printer(`${timeLabel} ${levelLabel} ${message}`);

  if (!meta.length) return;
  meta.forEach((entry) => {
    const line = formatMetaItem(entry)
      .split("\n")
      .map((part, index) => `${index === 0 ? "  -> " : "     "}${part}`)
      .join("\n");
    printer(paint(line, `${DIM}${FG.white}`));
  });
};

export const logger = {
  info: (message, ...meta) => print(console.log, "INFO", message, meta),
  success: (message, ...meta) => print(console.log, "OK", message, meta),
  warn: (message, ...meta) => print(console.warn, "WARN", message, meta),
  error: (message, ...meta) => print(console.error, "ERROR", message, meta),
  debug: (message, ...meta) => print(console.log, "DEBUG", message, meta),
  http: ({ requestId, method, url, status, durationMs }) => {
    const reqLabel = requestId ? paint(`#${String(requestId).padStart(4, "0")}`, `${DIM}${FG.white}`) : "";
    const methodLabel = paint((method || "GET").padEnd(6), `${BOLD}${methodColor(method)}`);
    const statusLabel = paint(String(status).padStart(3, " "), `${BOLD}${statusColor(status)}`);
    const durationLabel = paint(`${String(durationMs).padStart(4, " ")}ms`, `${DIM}${FG.white}`);
    const message = [reqLabel, methodLabel, url, "|", statusLabel, durationLabel].filter(Boolean).join(" ");
    print(console.log, "HTTP", message);
  }
};
