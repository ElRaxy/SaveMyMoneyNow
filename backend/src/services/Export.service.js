// Archivo: backend\src\services\Export.service.js. Codigo y comentarios en espanol.
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

const toDateLabel = (dateValue) => new Date(dateValue).toISOString().slice(0, 10);

export const createMovementsExcelBuffer = async (movements = []) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Movimientos");

  worksheet.columns = [
    { header: "Fecha", key: "fecha", width: 14 },
    { header: "Concepto", key: "concepto", width: 40 },
    { header: "Importe", key: "importe", width: 14 },
    { header: "Origen", key: "origen", width: 14 },
    { header: "Categoria", key: "categoria", width: 18 },
    { header: "Archivo", key: "archivo", width: 30 }
  ];

  movements.forEach((movement) => {
    worksheet.addRow({
      fecha: toDateLabel(movement.fecha),
      concepto: movement.concepto,
      importe: movement.importe,
      origen: movement.origen,
      categoria: movement.categoria,
      archivo: movement.archivo
    });
  });

  worksheet.getRow(1).font = { bold: true };
  return workbook.xlsx.writeBuffer();
};

export const createMovementsPdfBuffer = async (movements = []) => {
  const doc = new PDFDocument({ margin: 36, size: "A4" });
  const chunks = [];

  const streamPromise = new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fontSize(18).text("SaveMyMoneyNow - Historico de movimientos", { underline: true });
  doc.moveDown();
  doc.fontSize(11).text(`Registros: ${movements.length}`);
  doc.moveDown();

  movements.forEach((movement, index) => {
    const line = `${index + 1}. ${toDateLabel(movement.fecha)} | ${movement.concepto} | ${movement.importe} EUR | ${movement.origen} | ${movement.categoria}`;
    doc.fontSize(9).text(line);
    if ((index + 1) % 45 === 0) {
      doc.addPage();
    }
  });

  doc.end();
  return streamPromise;
};
