// Archivo: frontend\src\components\dashboard\FilterBar.jsx. Codigo y comentarios en espanol.
function FilterBar({ filters, onChange, onApply }) {
  return (
    <form
      className="filter-bar"
      onSubmit={(event) => {
        event.preventDefault();
        onApply();
      }}
    >
      <label>
        Desde
        <input
          type="date"
          value={filters.from}
          onChange={(event) => onChange({ from: event.target.value })}
        />
      </label>

      <label>
        Hasta
        <input
          type="date"
          value={filters.to}
          onChange={(event) => onChange({ to: event.target.value })}
        />
      </label>

      <label>
        Origen
        <select value={filters.origen} onChange={(event) => onChange({ origen: event.target.value })}>
          <option value="">Todos</option>
          <option value="cuenta">Cuenta</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="otro">Otro</option>
        </select>
      </label>

      <label>
        Categoria
        <select value={filters.categoria} onChange={(event) => onChange({ categoria: event.target.value })}>
          <option value="">Todas</option>
          <option value="Comida">Comida</option>
          <option value="Gasolina">Gasolina</option>
          <option value="Ocio">Ocio</option>
          <option value="Salud">Salud</option>
          <option value="Hogar">Hogar</option>
          <option value="Transporte">Transporte</option>
          <option value="Nomina">Nomina</option>
          <option value="Otros">Otros</option>
        </select>
      </label>

      <label>
        Comparativa
        <select
          value={filters.granularity || "month"}
          onChange={(event) => onChange({ granularity: event.target.value })}
        >
          <option value="day">Dia</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
          <option value="year">Ano</option>
        </select>
      </label>

      <button type="submit">Aplicar filtros</button>
    </form>
  );
}

export default FilterBar;
