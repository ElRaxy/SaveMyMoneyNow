// Archivo: frontend\src\components\duplicate\ConflictTable.jsx. Codigo y comentarios en espanol.
import { formatAmount } from "../../utils/formatAmount";
import { formatDate } from "../../utils/formatDate";

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
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Importe BBDD</th>
            <th>Importe nuevo</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {conflicts.map((conflict) => {
            const existing = conflict.existingRows?.[0];
            const selected = resolutions[conflict.conflictKey] || conflict.defaultAction;

            return (
              <tr key={conflict.conflictKey}>
                <td>{formatDate(conflict.incomingRow.fecha)}</td>
                <td>{conflict.incomingRow.concepto}</td>
                <td>{existing ? formatAmount(existing.importe) : "-"}</td>
                <td>{formatAmount(conflict.incomingRow.importe)}</td>
                <td>
                  <select
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
