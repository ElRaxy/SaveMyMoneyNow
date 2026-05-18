// Archivo: frontend\src\components\duplicate\ConflictTable.jsx
//
// Pantalla del paso "Extra: duplicados". Para cada movimiento entrante que
// choca con uno o varios documentos ya en BBDD (misma fecha + concepto),
// mostramos una fila con:
//   - los importes de TODOS los existentes (puede haber varios cuando el
//     usuario compra dos veces el mismo dia en el mismo sitio),
//   - el importe nuevo a importar,
//   - un <select> con las tres acciones permitidas.
//
// El default que llega del backend respeta la regla del enunciado:
//   - mismo importe en algun existente -> "Mantener existente" (probable
//     reimportacion del mismo Excel),
//   - importe siempre distinto         -> "Mantener ambos" (compras reales
//                                         distintas en el mismo dia).
import { formatAmount } from "../../utils/formatAmount";
import { formatDate } from "../../utils/formatDate";

// Etiquetas de las 3 acciones. El value se manda tal cual al backend
// (commitBatch en Import.service.js).
const actions = [
  { value: "keep_existing", label: "Mantener existente" },
  { value: "replace", label: "Reemplazar" },
  { value: "keep_both", label: "Mantener ambos" }
];

function ConflictTable({ conflicts = [], resolutions = {}, onChange }) {
  if (!conflicts.length) {
    return <p>No se han detectado conflictos.</p>;
  }

  return (
    <div className="table-wrap table-wrap-scroll table-wrap-dense">
      <table>
        <caption className="visually-hidden">
          Filas duplicadas detectadas. Elige por cada una si mantener lo existente,
          reemplazarlo o mantener ambos.
        </caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Concepto</th>
            <th scope="col">Importes en BBDD</th>
            <th scope="col">Importe nuevo</th>
            <th scope="col">Accion</th>
          </tr>
        </thead>
        <tbody>
          {conflicts.map((conflict) => {
            const existingRows = conflict.existingRows ?? [];
            const selected = resolutions[conflict.conflictKey] || conflict.defaultAction;
            const selectId = `conflict-action-${conflict.conflictKey}`;

            return (
              <tr key={conflict.conflictKey}>
                <td>{formatDate(conflict.incomingRow.fecha)}</td>
                <td>{conflict.incomingRow.concepto}</td>
                <td>
                  {existingRows.length === 0 ? (
                    "-"
                  ) : (
                    /*
                     * Renderizamos TODOS los existentes para que el usuario tenga
                     * contexto completo. Antes mostrabamos solo el primero y la
                     * accion por defecto podia parecer incoherente (la app decia
                     * "mantener ambos si importes distintos" pero solo veias uno
                     * de los importes existentes y el default ya era "mantener
                     * existente" porque otro de los ocultos coincidia).
                     */
                    <ul className="duplicate-existing-list">
                      {existingRows.map((existing) => (
                        <li key={existing._id} className="duplicate-existing-item">
                          {formatAmount(existing.importe)}
                          {existing.archivo ? (
                            <span className="duplicate-existing-item-extra"> · {existing.archivo}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>{formatAmount(conflict.incomingRow.importe)}</td>
                <td>
                  <label className="visually-hidden" htmlFor={selectId}>
                    Accion para {conflict.incomingRow.concepto} del{" "}
                    {formatDate(conflict.incomingRow.fecha)}
                  </label>
                  <select
                    id={selectId}
                    className="table-action-select"
                    value={selected}
                    onChange={(event) => onChange(conflict.conflictKey, event.target.value)}
                  >
                    {actions.map((action) => (
                      <option key={`${conflict.conflictKey}-${action.value}`} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ConflictTable;
