// Archivo: frontend\src\components\category\RuleCreator.jsx. Codigo y comentarios en espanol.
import { useState } from "react";

const categoryOptions = ["Comida", "Gasolina", "Ocio", "Salud", "Hogar", "Transporte", "Nomina", "Otros"];
const NEW_CATEGORY_VALUE = "__new_category__";

function RuleCreator({ onCreateRule }) {
  const [keyword, setKeyword] = useState("");
  const [categoria, setCategoria] = useState("Otros");
  const [customCategoria, setCustomCategoria] = useState("");
  const [priority, setPriority] = useState(90);

  const submitRule = (event) => {
    event.preventDefault();
    if (!keyword.trim()) return;
    const finalCategory = categoria === NEW_CATEGORY_VALUE ? customCategoria.trim() : categoria;
    if (!finalCategory) return;

    onCreateRule({
      type: "create",
      keyword: keyword.trim().toLowerCase(),
      categoria: finalCategory,
      priority: Number(priority)
    });

    setKeyword("");
    setCategoria("Otros");
    setCustomCategoria("");
    setPriority(90);
  };

  return (
    <form className="rule-form" onSubmit={submitRule}>
      <label>
        Concepto / palabra clave
        <input
          value={keyword}
          placeholder="Ejemplo: mercadona, netflix, repsol"
          onChange={(event) => setKeyword(event.target.value)}
        />
      </label>

      <label>
        Categoria
        <select value={categoria} onChange={(event) => setCategoria(event.target.value)}>
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value={NEW_CATEGORY_VALUE}>Nueva categoria...</option>
        </select>
      </label>

      {categoria === NEW_CATEGORY_VALUE ? (
        <label>
          Nombre categoria nueva
          <input
            value={customCategoria}
            placeholder="Ejemplo: Mascotas, Educacion, Viajes..."
            onChange={(event) => setCustomCategoria(event.target.value)}
          />
        </label>
      ) : null}

      <label>
        Prioridad
        <input
          type="number"
          min="0"
          max="1000"
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        />
      </label>

      <button type="submit">Agregar regla</button>
    </form>
  );
}

export default RuleCreator;
