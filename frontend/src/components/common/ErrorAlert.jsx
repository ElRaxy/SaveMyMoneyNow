// Archivo: frontend\src\components\common\ErrorAlert.jsx. Codigo y comentarios en espanol.
function ErrorAlert({ message }) {
  if (!message) return null;
  return <div className="error-alert">{message}</div>;
}

export default ErrorAlert;
