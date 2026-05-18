// Archivo: backend\src\services\Export.service.js
//
// Genera dos formatos de exportacion del historico:
//   - Excel (XLSX) via ExcelJS, con cabecera estilada, formato de moneda
//     en la columna Importe, freeze panes, auto-filter y colores
//     condicionales (verde positivo / rojo negativo).
//   - PDF via pdfkit, con maquetacion "estado de cuenta": cabecera con
//     titulo + fecha de generacion, bloque de KPIs (ingresos / gastos /
//     balance), tabla con columnas alineadas + filas alternadas +
//     cabecera repetida por pagina, y pie con "Pagina X de Y".
//
// Notas sobre pdfkit:
//   - Cuidado con doc.text(): por defecto, si el texto que escribes pasa
//     del bottom margin de la pagina, pdfkit anade una pagina nueva
//     AUTOMATICAMENTE para continuar el texto. Para evitar paginas en
//     blanco involuntarias usamos siempre `lineBreak: false` cuando
//     escribimos celdas y reseteamos doc.y a mano. La adicion de paginas
//     queda asi 100% controlada por nuestro `ensureSpaceForRow`.
//   - bufferPages:true en el constructor nos permite escribir el footer
//     ("Pagina X de Y") al final, cuando ya sabemos cuantas paginas hay.
//
// Limite de filas para PDF:
//   pdfkit construye el documento en memoria antes de emitirlo. Con muchos
//   miles de movimientos podriamos disparar el uso de RAM del proceso
//   Node. Cortamos a 5000 lineas y sugerimos al cliente que afine filtros
//   si necesita mas.
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const PDF_MAX_ROWS = 5000;

// Colores de marca para los PDF / XLSX. Coherentes con el frontend pero
// hex puros (pdfkit no entiende variables CSS).
const COLOR_INK = "#18181b";
const COLOR_INK_SOFT = "#52525b";
const COLOR_INK_MUTED = "#71717a";
const COLOR_BORDER = "#e4e4e7";
const COLOR_ROW_ALT = "#fafafa";
const COLOR_OK = "#16a34a";
const COLOR_DANGER = "#dc2626";

// Formato de fecha "YYYY-MM-DD" (ISO corto) para los exports: ordenable
// alfabeticamente y no ambiguo entre dd/mm y mm/dd.
const toDateLabel = (dateValue) => new Date(dateValue).toISOString().slice(0, 10);

// Formatea un numero en EUR con separador de miles y dos decimales.
// Usamos Intl.NumberFormat para no depender de localizacion del sistema.
const eurFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const formatEur = (value) => eurFormatter.format(Number(value || 0));

// Calcula los tres KPIs que mostramos al principio de cada export.
// Coincide con la logica de summary del listado en Movement.service.
const buildSummary = (movements) => {
  let ingresos = 0;
  let gastos = 0;
  movements.forEach((m) => {
    const importe = Number(m.importe || 0);
    if (importe >= 0) ingresos += importe;
    else gastos += Math.abs(importe);
  });
  return {
    ingresos,
    gastos,
    balance: ingresos - gastos
  };
};

// ============================================================
// EXCEL
// ============================================================

export const createMovementsExcelBuffer = async (movements = []) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SaveMyMoneyNow";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Movimientos", {
    views: [{ state: "frozen", ySplit: 1 }] // freeze de la cabecera al hacer scroll
  });

  worksheet.columns = [
    { header: "Fecha", key: "fecha", width: 14 },
    { header: "Concepto", key: "concepto", width: 42 },
    { header: "Importe", key: "importe", width: 16, style: { numFmt: '#,##0.00 "€";[Red]-#,##0.00 "€"' } },
    { header: "Origen", key: "origen", width: 12 },
    { header: "Categoria", key: "categoria", width: 16 },
    { header: "Archivo", key: "archivo", width: 36 }
  ];

  movements.forEach((movement) => {
    const row = worksheet.addRow({
      fecha: toDateLabel(movement.fecha),
      concepto: movement.concepto,
      importe: Number(movement.importe || 0),
      origen: movement.origen,
      categoria: movement.categoria,
      archivo: movement.archivo
    });
    // Color condicional verde / rojo en la celda de importe segun signo.
    const importeCell = row.getCell("importe");
    importeCell.font = {
      color: { argb: Number(movement.importe) >= 0 ? "FF16A34A" : "FFDC2626" }
    };
  });

  // Estilo de la fila de cabecera: fondo ink + texto blanco + bold.
  const headerRow = worksheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF18181B" }
    };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF18181B" } }
    };
  });

  // Auto-filter activable desde Excel.
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columns.length }
  };

  return workbook.xlsx.writeBuffer();
};

// ============================================================
// PDF
// ============================================================

// Layout: columnas como % del ancho usable. Permite cambiar el margen
// del documento sin tener que recolocar columnas a mano.
const PDF_COLUMNS = [
  { key: "fecha", header: "Fecha", width: 0.13, align: "left" },
  { key: "concepto", header: "Concepto", width: 0.36, align: "left" },
  { key: "importe", header: "Importe", width: 0.16, align: "right" },
  { key: "origen", header: "Origen", width: 0.1, align: "left" },
  { key: "categoria", header: "Categoria", width: 0.13, align: "left" },
  { key: "archivo", header: "Archivo", width: 0.12, align: "left" }
];

const ROW_HEIGHT = 18;
const TABLE_HEADER_HEIGHT = 22;
const FOOTER_RESERVED = 28; // espacio bajo la tabla para el footer fijo

const usableWidth = (doc) =>
  doc.page.width - doc.page.margins.left - doc.page.margins.right;

// "Bottom" hasta donde podemos dibujar filas sin pisar la zona reservada
// para el footer y sin que pdfkit autopage.
const contentBottom = (doc) =>
  doc.page.height - doc.page.margins.bottom - FOOTER_RESERVED;

const computeColWidths = (doc) => {
  const usable = usableWidth(doc);
  return PDF_COLUMNS.map((col) => Math.floor(col.width * usable));
};

const drawHorizontalRule = (doc, y, color = COLOR_BORDER) => {
  doc
    .save()
    .strokeColor(color)
    .lineWidth(0.5)
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .stroke()
    .restore();
};

// Cabecera del documento (solo en la primera pagina).
const drawDocumentHeader = (doc, total) => {
  const generatedAt = new Date().toLocaleString("es-ES", {
    dateStyle: "long",
    timeStyle: "short"
  });

  const left = doc.page.margins.left;
  let y = doc.page.margins.top;

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLOR_INK)
    .text("SaveMyMoneyNow", left, y, { lineBreak: false });
  y += 22;

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(COLOR_INK_SOFT)
    .text("Historico de movimientos", left, y, { lineBreak: false });
  y += 16;

  doc
    .fontSize(9)
    .fillColor(COLOR_INK_MUTED)
    .text(
      `Generado el ${generatedAt}  ·  ${total} registro${total === 1 ? "" : "s"}`,
      left,
      y,
      { lineBreak: false }
    );
  y += 16;

  drawHorizontalRule(doc, y);
  doc.x = left;
  doc.y = y + 14;
};

// Bloque KPIs (Ingresos / Gastos / Balance) en tres tarjetas iguales.
const drawSummary = (doc, summary) => {
  const startX = doc.page.margins.left;
  const startY = doc.y;
  const usable = usableWidth(doc);
  const gap = 8;
  const cardWidth = (usable - gap * 2) / 3;
  const cardHeight = 56;

  const cards = [
    { label: "INGRESOS", value: formatEur(summary.ingresos), color: COLOR_OK },
    { label: "GASTOS", value: formatEur(summary.gastos), color: COLOR_DANGER },
    {
      label: "BALANCE",
      value: formatEur(summary.balance),
      color: summary.balance >= 0 ? COLOR_OK : COLOR_DANGER
    }
  ];

  cards.forEach((card, index) => {
    const x = startX + index * (cardWidth + gap);
    doc
      .save()
      .lineWidth(0.5)
      .strokeColor(COLOR_BORDER)
      .roundedRect(x, startY, cardWidth, cardHeight, 6)
      .stroke()
      .restore();

    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(COLOR_INK_MUTED)
      .text(card.label, x + 12, startY + 10, {
        width: cardWidth - 24,
        characterSpacing: 1,
        lineBreak: false
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor(card.color)
      .text(card.value, x + 12, startY + 24, {
        width: cardWidth - 24,
        align: "left",
        lineBreak: false
      });
  });

  doc.x = startX;
  doc.y = startY + cardHeight + 18;
};

// Cabecera de la tabla. Reusable porque la repetimos al iniciar cada pagina.
const drawTableHeader = (doc, colWidths) => {
  const startX = doc.page.margins.left;
  const y = doc.y;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  doc
    .save()
    .fillColor(COLOR_INK)
    .rect(startX, y, totalWidth, TABLE_HEADER_HEIGHT)
    .fill()
    .restore();

  doc.font("Helvetica-Bold").fontSize(8).fillColor("#ffffff");

  let cursorX = startX;
  PDF_COLUMNS.forEach((col, index) => {
    doc.text(col.header.toUpperCase(), cursorX + 6, y + 7, {
      width: colWidths[index] - 12,
      align: col.align,
      characterSpacing: 0.5,
      lineBreak: false
    });
    cursorX += colWidths[index];
  });

  doc.x = startX;
  doc.y = y + TABLE_HEADER_HEIGHT;
};

// Antes de pintar una fila, comprueba si cabe en la pagina actual. Si no
// cabe, anade pagina y vuelve a pintar el header de tabla.
const ensureSpaceForRow = (doc, colWidths) => {
  if (doc.y + ROW_HEIGHT > contentBottom(doc)) {
    doc.addPage();
    doc.x = doc.page.margins.left;
    doc.y = doc.page.margins.top;
    drawTableHeader(doc, colWidths);
  }
};

const drawTableRow = (doc, movement, colWidths, rowIndex) => {
  const startX = doc.page.margins.left;
  const y = doc.y;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  // Zebra rows: alterna fondo en filas pares para legibilidad.
  if (rowIndex % 2 === 1) {
    doc
      .save()
      .fillColor(COLOR_ROW_ALT)
      .rect(startX, y, totalWidth, ROW_HEIGHT)
      .fill()
      .restore();
  }

  const importe = Number(movement.importe || 0);
  const importeColor = importe >= 0 ? COLOR_OK : COLOR_DANGER;

  const cells = [
    { value: toDateLabel(movement.fecha), color: COLOR_INK },
    { value: movement.concepto || "", color: COLOR_INK },
    { value: formatEur(importe), color: importeColor, bold: true },
    { value: movement.origen || "", color: COLOR_INK_SOFT },
    { value: movement.categoria || "", color: COLOR_INK_SOFT },
    { value: movement.archivo || "", color: COLOR_INK_MUTED }
  ];

  let cursorX = startX;
  cells.forEach((cell, index) => {
    doc
      .font(cell.bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(8.5)
      .fillColor(cell.color)
      .text(cell.value, cursorX + 6, y + 5, {
        width: colWidths[index] - 12,
        align: PDF_COLUMNS[index].align,
        lineBreak: false,
        ellipsis: true
      });
    cursorX += colWidths[index];
  });

  // Linea separadora inferior sutil.
  doc
    .save()
    .strokeColor(COLOR_BORDER)
    .lineWidth(0.3)
    .moveTo(startX, y + ROW_HEIGHT)
    .lineTo(startX + totalWidth, y + ROW_HEIGHT)
    .stroke()
    .restore();

  // Setear doc.y a mano para no depender de donde lo deje pdfkit.
  doc.x = startX;
  doc.y = y + ROW_HEIGHT;
};

// Pie con "Pagina X de Y" + marca. Se aplica al final, ya bufferadas
// todas las paginas, para conocer el total.
const drawPageFooters = (doc) => {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);

    // Posicionamos el footer JUSTO sobre el bottom margin (no dentro):
    // asi pdfkit no auto-anade pagina al renderizar la linea.
    const footerY = doc.page.height - doc.page.margins.bottom - 12;
    const left = doc.page.margins.left;
    const width = usableWidth(doc);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLOR_INK_MUTED)
      .text(`Pagina ${range.start + i + 1} de ${range.count}`, left, footerY, {
        width,
        align: "center",
        lineBreak: false
      });

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLOR_INK_MUTED)
      .text("SaveMyMoneyNow", left, footerY, {
        width,
        align: "right",
        lineBreak: false
      });
  }
};

export const createMovementsPdfBuffer = async (movements = []) => {
  if (movements.length > PDF_MAX_ROWS) {
    const error = new Error(
      `Demasiados registros para exportar a PDF (${movements.length}). Maximo ${PDF_MAX_ROWS}: usa filtros (rango de fechas, origen o categoria) para reducir el listado.`
    );
    error.status = 413;
    throw error;
  }

  // bufferPages: necesario para escribir "X de Y" al final.
  // autoFirstPage: false para evitar que pdfkit cree una pagina extra
  // por si acaso; la primera la anadimos nosotros explicitamente.
  const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });
  const chunks = [];

  const streamPromise = new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const summary = buildSummary(movements);
  const colWidths = computeColWidths(doc);

  drawDocumentHeader(doc, movements.length);
  drawSummary(doc, summary);
  drawTableHeader(doc, colWidths);

  movements.forEach((movement, index) => {
    ensureSpaceForRow(doc, colWidths);
    drawTableRow(doc, movement, colWidths, index);
  });

  if (movements.length === 0) {
    doc
      .moveDown(0.6)
      .font("Helvetica-Oblique")
      .fontSize(10)
      .fillColor(COLOR_INK_MUTED)
      .text("No hay movimientos que cumplan los filtros seleccionados.", {
        align: "center",
        lineBreak: false
      });
  }

  drawPageFooters(doc);

  doc.end();
  return streamPromise;
};
