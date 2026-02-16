// Archivo: frontend\src\components\layout\StepLayout.jsx. Codigo y comentarios en espanol.
import { NavLink, useLocation } from "react-router-dom";

const steps = [
  { to: "/", label: "0. Bienvenida", end: true },
  { to: "/upload", label: "1. Subida" },
  { to: "/detection", label: "2. Deteccion" },
  { to: "/confirm", label: "3. Confirmacion" },
  { to: "/normalization", label: "4. Normalizacion" },
  { to: "/categorization", label: "5. Categorizacion" },
  { to: "/duplicates", label: "Extra. Duplicados" },
  { to: "/dashboard", label: "6. Dashboard" },
  { to: "/history", label: "7. Historico" }
];

function StepLayout({ title, subtitle = "", compact = false, mainClassName = "", children }) {
  const location = useLocation();
  const currentIndex = steps.findIndex((step) => step.to === location.pathname);
  const safeIndex = currentIndex >= 0 ? currentIndex : 0;
  const progress = Math.round(((safeIndex + 1) / steps.length) * 100);
  const shellClassName = compact ? "app-shell app-shell-compact" : "app-shell";
  const computedMainClassName = ["app-main", mainClassName].filter(Boolean).join(" ");

  return (
    <div className={shellClassName}>
      <header className="app-header">
        <h1>SaveMyMoneyNow</h1>
        <p>Asistente de analisis financiero personal</p>
      </header>

      <section className="wizard-progress">
        <div className="wizard-progress-top">
          <p>
            Paso actual: <strong>{steps[safeIndex]?.label || "Inicio"}</strong>
          </p>
          <p>{progress}%</p>
        </div>
        <div className="wizard-progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <nav className="step-nav">
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

      <main className={computedMainClassName}>
        <h2>{title}</h2>
        {subtitle ? <p className="lead">{subtitle}</p> : null}
        {children}
      </main>
    </div>
  );
}

export default StepLayout;
