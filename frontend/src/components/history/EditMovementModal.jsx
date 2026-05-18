// Archivo: frontend\src\components\history\EditMovementModal.jsx. Codigo y comentarios en espanol.
//
// Modal de edicion de un movimiento.
//
// POR QUE un modal y no una pagina dedicada:
//   El usuario viene de una tabla con N filas y normalmente quiere editar una
//   sola y volver. Romper el contexto con una navegacion completa seria
//   excesivo y perderia el scroll/paginacion de la tabla.
//
// POR QUE focus-trap basico (no libreria):
//   Para V1 nos basta con (a) focus al primer input al abrir y (b) cerrar con
//   Escape. Tab cycling completo se delega a focus-trap-react cuando la
//   superficie de UI lo justifique.
//
// POR QUE backdrop click cierra:
//   Patron WAI-ARIA estandar. El usuario espera poder "salirse" sin tener que
//   buscar el boton cancelar.
//
// POR QUE role=dialog + aria-modal + aria-labelledby:
//   Lectores de pantalla anuncian "dialogo" + titulo y limitan la navegacion
//   al contenido del dialog mientras esta abierto.
import { useEffect, useRef, useState } from "react";
import { CATEGORY_OPTIONS } from "../../constants/categories";
import { formatDate } from "../../utils/formatDate";

const ORIGEN_OPTIONS = ["tarjeta", "cuenta", "otro"];

function EditMovementModal({ movement, onClose, onSave }) {
  // El modal se controla por la presencia de `movement`. Si es null, no
  // renderizamos nada (mas barato que mantener un estado interno isOpen).
  const titleId = "edit-movement-title";
  const firstInputRef = useRef(null);

  const [form, setForm] = useState(() => ({
    concepto: movement?.concepto || "",
    importe: movement?.importe ?? "",
    categoria: movement?.categoria || CATEGORY_OPTIONS[0],
    origen: movement?.origen || "tarjeta"
  }));
  const [saving, setSaving] = useState(false);

  // Sincronizar el form si cambia el movimiento (ej. el padre abre otro
  // movimiento sin desmontar el modal). Sin esto se quedaria con los valores
  // del primero.
  useEffect(() => {
    if (!movement) return;
    setForm({
      concepto: movement.concepto || "",
      importe: movement.importe ?? "",
      categoria: movement.categoria || CATEGORY_OPTIONS[0],
      origen: movement.origen || "tarjeta"
    });
  }, [movement]);

  // Focus inicial + listener Escape.
  useEffect(() => {
    if (!movement) return;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    // Pequeno delay para esperar al render: focus inmediato puede fallar
    // si el elemento aun no esta montado en algunos navegadores.
    const focusTimer = window.setTimeout(() => {
      firstInputRef.current?.focus();
    }, 30);
    return () => {
      document.removeEventListener("keydown", handleKey);
      window.clearTimeout(focusTimer);
    };
  }, [movement, onClose]);

  if (!movement) return null;

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      // Construimos un patch solo con los campos que cambian: evita updates
      // innecesarios y deja al backend la posibilidad de validar field a field.
      const patch = {};
      if (form.concepto !== (movement.concepto || "")) patch.concepto = form.concepto;
      if (String(form.importe) !== String(movement.importe ?? "")) {
        const num = Number(form.importe);
        if (!Number.isNaN(num)) patch.importe = num;
      }
      if (form.categoria !== (movement.categoria || "")) patch.categoria = form.categoria;
      if (form.origen !== (movement.origen || "")) patch.origen = form.origen;

      await onSave(patch);
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (event) => {
    // Solo cerrar si el click es directamente en el backdrop, no en el panel.
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h3 id={titleId} className="modal-title">Editar movimiento</h3>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="edit-fecha">Fecha</label>
            <input
              id="edit-fecha"
              type="text"
              value={formatDate(movement.fecha)}
              readOnly
              aria-readonly="true"
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-concepto">Concepto</label>
            <input
              id="edit-concepto"
              ref={firstInputRef}
              type="text"
              value={form.concepto}
              onChange={handleChange("concepto")}
              required
              maxLength={200}
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-importe">Importe</label>
            <input
              id="edit-importe"
              type="number"
              step="0.01"
              value={form.importe}
              onChange={handleChange("importe")}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="edit-categoria">Categoría</label>
            <select
              id="edit-categoria"
              value={form.categoria}
              onChange={handleChange("categoria")}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="edit-origen">Origen</label>
            <select
              id="edit-origen"
              value={form.origen}
              onChange={handleChange("origen")}
            >
              {ORIGEN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMovementModal;
