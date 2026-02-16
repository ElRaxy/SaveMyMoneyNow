// Archivo: frontend/src/components/table/PreviewTable.jsx. Codigo y comentarios en espanol.
const formatCellValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return value;

  const trimmed = value.trim();

  // Formatea fechas ISO tecnicas para hacerlas legibles en UI.
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("es-ES");
    }
  }

  // Corrige simbolos de euro corruptos por codificacion.
  if (trimmed.includes("â‚¬")) {
    return trimmed.replace(/â‚¬/g, "€");
  }

  // Algunos extractores convierten el simbolo de euro en "?" al leer Excel.
  if (/[0-9],[0-9]{2}\?$/.test(trimmed)) {
    return trimmed.replace(/\?$/, "€");
  }

  return value;
};

function PreviewTable({ headers = [], rows = [], className = "" }) {
  if (!rows || rows.length === 0) {
    return <p>Sin datos para mostrar.</p>;
  }

  const computedHeaders = headers.length ? headers : Object.keys(rows[0] || {});
  const wrapperClassName = `table-wrap ${className}`.trim();

  return (
    <div className={wrapperClassName}>
      <table>
        <thead>
          <tr>
            {computedHeaders.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`row-${index}`}>
              {computedHeaders.map((header, colIndex) => (
                <td key={`cell-${index}-${colIndex}`}>
                  {formatCellValue(Array.isArray(row) ? row[colIndex] : row[header])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PreviewTable;
