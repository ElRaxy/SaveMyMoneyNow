// Archivo: frontend\src\components\upload\FileDropzone.jsx. Codigo y comentarios en espanol.
import { useRef, useState } from "react";

function FileDropzone({ onFilesSelected }) {
  const inputRef = useRef(null);
  const [isOver, setIsOver] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    onFilesSelected(files);
  };

  return (
    <section
      className={`dropzone ${isOver ? "over" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <p>Arrastra archivos Excel aqui (.xls, .xlsx)</p>
      <button type="button" onClick={() => inputRef.current?.click()}>
        Seleccionar archivos
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        multiple
        hidden
        onChange={(event) => handleFiles(event.target.files)}
      />
    </section>
  );
}

export default FileDropzone;
