// Archivo: frontend\src\components\detection\DetectionCard.jsx. Codigo y comentarios en espanol.
import PreviewTable from "../table/PreviewTable";

function DetectionCard({ fileName, detection }) {
  return (
    <article className="card">
      <h3>{fileName}</h3>
      <p>Fila cabecera detectada: {detection.headerRowDetected}</p>
      <p>
        Columnas candidatas:
        {" "}
        Fecha ({detection.possibleColumns.fecha || "-"})
        {" | "}
        Concepto ({detection.possibleColumns.concepto || "-"})
        {" | "}
        Importe ({detection.possibleColumns.importe || "-"})
      </p>
      <PreviewTable headers={detection.headers} rows={detection.previewRows} />
    </article>
  );
}

export default DetectionCard;
