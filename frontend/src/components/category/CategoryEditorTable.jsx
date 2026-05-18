// Archivo: frontend\src\components\category\CategoryEditorTable.jsx
//
// Tabla del paso 5 (Categorizacion). Para cada movimiento muestra fecha,
// concepto, importe y un <select> con la categoria. El select admite:
//   - elegir una categoria del catalogo (CATEGORY_OPTIONS),
//   - mantener una categoria personalizada que llegue del backend,
//   - abrir un editor inline para crear una categoria nueva (sentinel
//     NEW_CATEGORY_VALUE).
// El checkbox "Aprender regla" decide si la edicion se persistira como
// CategoryRule en BBDD (ver Categorization.service.js#learnRulesFromCategoryEdits).
import { useState } from "react";
import { CATEGORY_OPTIONS, NEW_CATEGORY_VALUE } from "../../constants/categories";
import { formatAmount } from "../../utils/formatAmount";
import { formatDate } from "../../utils/formatDate";

function CategoryEditorTable({ rows = [], edits = [], onEdit }) {
  const editMap = new Map(edits.map((item) => [item.tempId, item]));
  const [draftByRow, setDraftByRow] = useState({});
  const [creatingByRow, setCreatingByRow] = useState({});

  const applyCategory = (row, categoria) => {
    onEdit({
      tempId: row.tempId,
      categoria,
      keyword: row.concepto,
      learn: true
    });
  };

  return (
    <div className="table-wrap table-wrap-scroll table-wrap-dense">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Concepto</th>
            <th>Importe</th>
            <th>Categoria</th>
            <th>Aprender regla</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const edit = editMap.get(row.tempId);
            const categoria = edit?.categoria || row.categoria || "Otros";
            const normalizedCategory = String(categoria).trim() || "Otros";
            const hasCustomCategory = !CATEGORY_OPTIONS.includes(normalizedCategory);
            const categoryOptions = hasCustomCategory
              ? [...CATEGORY_OPTIONS, normalizedCategory]
              : CATEGORY_OPTIONS;
            const creating = Boolean(creatingByRow[row.tempId]);

            return (
              <tr key={row.tempId}>
                <td>{formatDate(row.fecha)}</td>
                <td>{row.concepto}</td>
                <td>{formatAmount(row.importe)}</td>
                <td className="table-cell-select">
                  {!creating ? (
                    <select
                      className="table-action-select"
                      value={normalizedCategory}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === NEW_CATEGORY_VALUE) {
                          setCreatingByRow((prev) => ({ ...prev, [row.tempId]: true }));
                          setDraftByRow((prev) => ({ ...prev, [row.tempId]: "" }));
                          return;
                        }
                        applyCategory(row, value);
                      }}
                    >
                      {categoryOptions.map((item) => (
                        <option key={`${row.tempId}-${item}`} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value={NEW_CATEGORY_VALUE}>Nueva categoria...</option>
                    </select>
                  ) : (
                    <div className="inline-category-editor">
                      <input
                        value={draftByRow[row.tempId] || ""}
                        placeholder="Categoria nueva"
                        onChange={(event) =>
                          setDraftByRow((prev) => ({
                            ...prev,
                            [row.tempId]: event.target.value
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const customCategory = String(draftByRow[row.tempId] || "").trim();
                          if (!customCategory) return;
                          applyCategory(row, customCategory);
                          setCreatingByRow((prev) => ({ ...prev, [row.tempId]: false }));
                        }}
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                </td>
                <td className="table-cell-checkbox">
                  <input
                    type="checkbox"
                    checked={edit?.learn !== false}
                    onChange={(event) =>
                      onEdit({
                        tempId: row.tempId,
                        categoria,
                        keyword: row.concepto,
                        learn: event.target.checked
                      })
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CategoryEditorTable;
