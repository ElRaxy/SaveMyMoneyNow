// Generador de XLSX sintetico estilo Santander.
//
// Estructura mas simple: una sola fila de cabecera ("Fecha / Descripcion /
// Cantidad") y los movimientos justo debajo. Sirve para comprobar que la
// heuristica de deteccion de columnas es robusta a distintos vocabularios
// bancarios y a la ausencia de "Saldo".
import xlsx from "xlsx";

export const buildSantanderXlsx = () => {
  const aoa = [
    ["Fecha", "Descripcion", "Cantidad"],
    ["01/10/2025", "Compra LIDL Centro", "-32,40"],
    ["02/10/2025", "Transferencia recibida Ana", "200,00"],
    ["03/10/2025", "Spotify Premium", "-9,99"],
    ["04/10/2025", "Cepsa Estacion", "-48,20"],
    ["05/10/2025", "Farmacia Sol", "-6,10"],
    ["06/10/2025", "DIA Express", "-18,75"]
  ];

  const sheet = xlsx.utils.aoa_to_sheet(aoa);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, sheet, "Movimientos");
  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
};
