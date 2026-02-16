// Archivo: frontend\src\components\upload\FileList.jsx. Codigo y comentarios en espanol.
function FileList({ files = [] }) {
  if (!files.length) {
    return <p>No hay archivos seleccionados.</p>;
  }

  return (
    <ul className="simple-list file-list">
      {files.map((file) => (
        <li key={file.name || file.fileId}>
          <strong>{file.name || file.fileName}</strong>
          <span>{file.size ? ` (${Math.round(file.size / 1024)} KB)` : ""}</span>
        </li>
      ))}
    </ul>
  );
}

export default FileList;
