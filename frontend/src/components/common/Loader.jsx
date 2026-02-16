// Archivo: frontend\src\components\common\Loader.jsx. Codigo y comentarios en espanol.
function Loader({ text = "Cargando..." }) {
  return (
    <div className="loader">
      <span className="loader-dot" />
      {text}
    </div>
  );
}

export default Loader;
