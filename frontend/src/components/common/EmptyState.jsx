// Archivo: frontend/src/components/common/EmptyState.jsx. Codigo y comentarios en espanol.
//
// Componente EmptyState: estado vacio reutilizable para vistas sin datos.
//
// POR QUE existe:
//   Antes mostrabamos charts/tablas vacias o simplemente "no hay datos" en
//   texto plano. Eso es desorientador para alguien que acaba de aterrizar
//   en el dashboard sin haber importado nada. UX research basico: un vacio
//   debe ser una oportunidad guiada, no una pared.
//
//   Patron clasico de design systems (Material, Polaris, etc.): un empty
//   state combina (1) icono o ilustracion minimal, (2) titulo, (3) descrip-
//   cion corta del por que esta vacio y (4) CTA claro hacia la accion que
//   resuelve el vacio.
//
// POR QUE NavLink y no <a>:
//   Mantiene SPA routing (no recarga la pagina) y respeta el contexto del
//   ImportWizardProvider.
//
// POR QUE icono inline SVG y no libreria:
//   El proyecto NO tiene libreria de iconos instalada y traer una (lucide,
//   phosphor) solo para un icono seria abuso de dependencias contrario al
//   spirit de Karpathy Rule 2 (simplicity first).
import { NavLink } from "react-router-dom";

function DefaultIcon() {
  // Icono minimal de "grafico de barras": tres barras de altura creciente.
  // Comunica visualmente que la vista esta pensada para mostrar datos.
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      role="img"
      aria-label="Sin datos"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="8" y="34" width="10" height="14" rx="2" fill="var(--brand-soft)" stroke="var(--brand)" strokeWidth="1.5" />
      <rect x="23" y="22" width="10" height="26" rx="2" fill="var(--brand-soft)" stroke="var(--brand)" strokeWidth="1.5" />
      <rect x="38" y="12" width="10" height="36" rx="2" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
    </svg>
  );
}

function EmptyState({ title, description, ctaLabel, ctaTo, icon = null }) {
  return (
    <section className="empty-state" role="status" aria-live="polite">
      <div className="empty-state-icon" aria-hidden={icon ? undefined : "true"}>
        {icon || <DefaultIcon />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description ? <p className="empty-state-description">{description}</p> : null}
      {ctaLabel && ctaTo ? (
        <div className="empty-state-cta">
          <NavLink to={ctaTo} className="empty-state-cta-link">
            {ctaLabel}
          </NavLink>
        </div>
      ) : null}
    </section>
  );
}

export default EmptyState;
