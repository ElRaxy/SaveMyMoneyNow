// Archivo: frontend/src/components/layout/StepLayout.jsx
//
// Layout comun a todas las vistas del wizard. Aporta:
//   - cabecera con el titulo de la app,
//   - barra de progreso "X%" basada en el paso actual,
//   - navegacion lateral con los 9 pasos,
//   - <main> donde cada vista renderiza su contenido propio via <Outlet />.
//
// POR QUE el patron <Outlet /> (react-router 6 idiomatico):
//   Antes cada vista importaba StepLayout y envolvia su contenido. Eso era
//   teléfono-descompuesto: cada vista necesitaba conocer la "shell". El
//   patron correcto en react-router 6 es declarar StepLayout como Route
//   padre y dejar que cada vista hija sea un Outlet (placeholder donde el
//   router inyecta la vista activa). Asi:
//     - se elimina la duplicacion de "<StepLayout title=...>{...}" en 9 sitios,
//     - el layout deja de saber nada del contenido (Karpathy Rule 2),
//     - cada vista controla su propio <h2> y descripcion ("lead") sin tener
//       que pasarlos como props al layout.
//
// Notas de accesibilidad:
//   - Los enlaces usan NavLink + aria-current="page" en el activo, para que
//     los lectores de pantalla anuncien "step actual".
//   - <progress> se anade como complemento al texto "X%" (sirve a la vez
//     como elemento semantico para asistentes y como barra visual).
//   - <nav>, <main>, <header> son landmarks: facilitan saltar entre zonas
//     con un lector de pantalla y mejoran SEO basico.
import { NavLink, Outlet, useLocation } from "react-router-dom";

const steps = [
  { to: "/", label: "0. Bienvenida", end: true },
  { to: "/upload", label: "1. Subida" },
  { to: "/detection", label: "2. Detección" },
  { to: "/confirm", label: "3. Confirmación" },
  { to: "/normalization", label: "4. Normalización" },
  { to: "/categorization", label: "5. Categorización" },
  { to: "/duplicates", label: "Extra. Duplicados" },
  { to: "/dashboard", label: "6. Dashboard" },
  { to: "/history", label: "7. Histórico" }
];

// Rutas que necesitan layout compacto (Dashboard) y main especial.
// Se mantiene como mapa simple para no introducir contexto innecesario.
const ROUTE_LAYOUT = {
  "/dashboard": { compact: true, mainClassName: "dashboard-main" }
};

function StepLayout() {
  const location = useLocation();
  const currentIndex = steps.findIndex((step) => step.to === location.pathname);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const progress = Math.round(((safeIndex + 1) / steps.length) * 100);

  const routeConfig = ROUTE_LAYOUT[location.pathname] || {};
  const compact = Boolean(routeConfig.compact);
  const extraMainClass = routeConfig.mainClassName || "";

  const shellClassName = compact ? "app-shell app-shell-compact" : "app-shell";
  const computedMainClassName = ["app-main", extraMainClass].filter(Boolean).join(" ");

  return (
    <div className={shellClassName}>
      {/* Skip-link: solo visible al recibir foco con Tab. Permite saltar
          la navegacion del wizard e ir directamente al contenido. */}
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>

      <header className="app-header">
        <h1>SaveMyMoneyNow</h1>
        <p>Asistente de análisis financiero personal</p>
      </header>

      <section className="wizard-progress" aria-label="Progreso del asistente">
        <div className="wizard-progress-top">
          <p>
            Paso actual: <strong>{steps[safeIndex]?.label || "Inicio"}</strong>
          </p>
          <p aria-hidden="true">{progress}%</p>
        </div>
        <div className="wizard-progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
        <progress
          className="visually-hidden"
          max={100}
          value={progress}
          aria-label={`Progreso ${progress} por ciento`}
        />
      </section>

      <nav className="step-nav" aria-label="Pasos del asistente">
        {steps.map((step) => (
          <NavLink
            key={step.to}
            to={step.to}
            end={step.end}
            className={({ isActive }) => (isActive ? "step-link active" : "step-link")}
          >
            {step.label}
          </NavLink>
        ))}
      </nav>

      <main id="main-content" className={computedMainClassName} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}

export default StepLayout;
