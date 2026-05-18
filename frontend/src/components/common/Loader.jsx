// Archivo: frontend\src\components\common\Loader.jsx
//
// Indicador de carga. Aspectos de accesibilidad:
//   - role="status" + aria-live="polite" notifica el cambio sin
//     interrumpir lo que el usuario este leyendo (a diferencia de
//     ErrorAlert, que es "assertive").
//   - El texto cambiante (prop `text`) sirve a la vez como informacion
//     visual y como mensaje para lector de pantalla.

function Loader({ text = "Cargando..." }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="loader-dot" aria-hidden="true" />
      {text}
    </div>
  );
}

export default Loader;
