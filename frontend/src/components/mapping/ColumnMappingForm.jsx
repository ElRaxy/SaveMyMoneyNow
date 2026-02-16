// Archivo: frontend\src\components\mapping\ColumnMappingForm.jsx. Codigo y comentarios en espanol.
function ColumnMappingForm({ file, detection, value, onChange }) {
  const headers = detection.headers || [];
  const currentValue = value || {
    fileId: file.fileId,
    headerRow: detection.headerRowDetected || 1,
    origen: "otro",
    mapping: {
      fecha: headers[0] || "",
      concepto: headers[1] || "",
      importe: headers[2] || ""
    }
  };

  const handleSelect = (field, selected) => {
    onChange(file.fileId, {
      ...currentValue,
      mapping: {
        ...currentValue.mapping,
        [field]: selected
      }
    });
  };

  return (
    <article className="card">
      <h3>{file.originalName || file.fileName}</h3>

      <div className="grid-2">
        <label>
          Fila cabecera
          <input
            type="number"
            min="1"
            value={currentValue.headerRow}
            onChange={(event) =>
              onChange(file.fileId, {
                ...currentValue,
                headerRow: Number(event.target.value)
              })
            }
          />
        </label>

        <label>
          Origen
          <select
            value={currentValue.origen}
            onChange={(event) =>
              onChange(file.fileId, {
                ...currentValue,
                origen: event.target.value
              })
            }
          >
            <option value="tarjeta">Tarjeta</option>
            <option value="cuenta">Cuenta</option>
            <option value="otro">Otro</option>
          </select>
        </label>

        <label>
          Columna Fecha
          <select value={currentValue.mapping.fecha} onChange={(event) => handleSelect("fecha", event.target.value)}>
            {headers.map((header) => (
              <option key={`${file.fileId}-fecha-${header}`} value={header}>
                {header}
              </option>
            ))}
          </select>
        </label>

        <label>
          Columna Concepto
          <select
            value={currentValue.mapping.concepto}
            onChange={(event) => handleSelect("concepto", event.target.value)}
          >
            {headers.map((header) => (
              <option key={`${file.fileId}-concepto-${header}`} value={header}>
                {header}
              </option>
            ))}
          </select>
        </label>

        <label>
          Columna Importe
          <select
            value={currentValue.mapping.importe}
            onChange={(event) => handleSelect("importe", event.target.value)}
          >
            {headers.map((header) => (
              <option key={`${file.fileId}-importe-${header}`} value={header}>
                {header}
              </option>
            ))}
          </select>
        </label>
      </div>
    </article>
  );
}

export default ColumnMappingForm;
