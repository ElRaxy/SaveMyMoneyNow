// Archivo: frontend\src\components\common\ErrorAlert.jsx
//
// Banner de error reutilizable. Anotaciones de accesibilidad:
//   - role="alert" hace que los lectores de pantalla lo anuncien al
//     aparecer (region implicita "live"). Lo usamos solo para errores
//     reales: para mensajes informativos hay que preferir Loader o un
//     toast con role="status".
//   - aria-live="assertive" interrumpe a la voz para anunciar de
//     inmediato; los usuarios con sintesis lo escucharan sin tener que
//     navegar manualmente al banner.

function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="error-alert" role="alert" aria-live="assertive">
      <strong className="error-alert-prefix">Error: </strong>
      {message}
    </div>
  );
}

export default ErrorAlert;
