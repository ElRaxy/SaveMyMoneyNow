// Generador de XLSX sintetico estilo BBVA.
//
// La estructura imita lo que el enunciado describe: las 3 primeras filas
// son metadata (nombre cliente, IBAN, fecha), la fila 4 es la cabecera
// real ("Fecha Operacion / Fecha Valor / Tipo Movimiento / Importe /
// Saldo") y a partir de la fila 5 vienen los movimientos.
//
// Devuelve un Buffer .xlsx en memoria, sin tocar disco. Lo usamos tanto
// para enviarlo por multipart con supertest como para escribirlo a un
// temp file y pasarlo a `analyzeFile`.
import xlsx from "xlsx";

export const buildBbvaXlsx = () => {
  const aoa = [
    ["Cliente:", "Juan Practicas", "", "", ""],
    ["IBAN:", "ES12 3456 7890 1234 5678 9012", "", "", ""],
    ["Fecha extracto:", "30/09/2025", "", "", ""],
    ["Fecha Operacion", "Fecha Valor", "Tipo Movimiento", "Importe", "Saldo"],
    ["17/09/2025", "17/09/2025", "Compra MERCADONA", "-45,15", "1234,56"],
    ["18/09/2025", "18/09/2025", "Nomina Empresa S.A.", "1500,00", "2734,56"],
    ["19/09/2025", "19/09/2025", "Bizum a Maria", "-20,00", "2714,56"],
    ["20/09/2025", "20/09/2025", "Repsol Estacion", "-55,30", "2659,26"],
    ["21/09/2025", "21/09/2025", "Netflix Suscripcion", "-12,99", "2646,27"],
    ["22/09/2025", "22/09/2025", "Farmacia Centro", "-8,40", "2637,87"]
  ];

  const sheet = xlsx.utils.aoa_to_sheet(aoa);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, sheet, "Movimientos");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
};
