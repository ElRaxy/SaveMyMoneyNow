// Archivo: frontend\src\components\upload\FileDropzone.jsx
//
// Zona de subida con dos vias equivalentes:
//   1) drag & drop sobre el contenedor.
//   2) clic en "Seleccionar archivos" (o pulsar Enter/Space sobre el
//      contenedor cuando esta enfocado por teclado) -> abre el dialogo
//      nativo de archivos.
//
// Accesibilidad:
//   - role="button" + tabIndex=0 + onKeyDown hace operable la zona via
//     teclado, no solo via raton (criterio WCAG 2.1.1 Keyboard).
//   - aria-label describe la zona porque su contenido visible es
//     instrucciones, no un texto que sirva como nombre accesible.
//   - El <input type="file"> queda oculto pero focusable (no aplica
//     tabIndex=-1 para que los usuarios de SR puedan tabular hasta el si
//     prefieren ese camino).
import { useRef, useState } from "react";

function FileDropzone({ onFilesSelected }) {
  const inputRef = useRef(null);
  const [isOver, setIsOver] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    onFilesSelected(files);
  };

  // Abre el dialogo nativo. Lo extraemos para reutilizarlo desde el
  // teclado (Enter/Space) y desde el boton "Seleccionar archivos".
  const openFileDialog = () => {
    inputRef.current?.click();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      openFileDialog();
    }
  };

  return (
    <section
      className={`dropzone ${isOver ? "over" : ""}`}
      role="button"
      tabIndex={0}
      aria-label="Zona de subida de archivos Excel. Pulsa Enter o arrastra archivos para abrir el dialogo."
      onKeyDown={handleKeyDown}
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
      <button
        type="button"
        onClick={(event) => {
          // El click del boton no debe burbujear y disparar dos veces el
          // dialogo (una por el boton, otra por el role="button" del
          // contenedor padre).
          event.stopPropagation();
          openFileDialog();
        }}
      >
        Seleccionar archivos
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xls,.xlsx"
        multiple
        hidden
        aria-hidden="true"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </section>
  );
}

export default FileDropzone;
