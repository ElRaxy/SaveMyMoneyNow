// Archivo: frontend\src\views\UploadView.jsx. Codigo y comentarios en espanol.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FileDropzone from "../components/upload/FileDropzone";
import FileList from "../components/upload/FileList";
import ErrorAlert from "../components/common/ErrorAlert";
import Loader from "../components/common/Loader";
import { useToast } from "../components/common/Toast";
import { uploadFiles } from "../services/importApi";
import { useImportWizard } from "../state/ImportWizardContext";

function UploadView() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { dispatch, actionTypes } = useImportWizard();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onFilesSelected = (files) => {
    setSelectedFiles((prev) => {
      const current = [...prev, ...files];
      const unique = new Map(current.map((file) => [`${file.name}-${file.size}`, file]));
      return Array.from(unique.values());
    });
  };

  const onUpload = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await uploadFiles(selectedFiles);
      dispatch({
        type: actionTypes.SET_BATCH,
        payload: {
          batchId: response.batchId,
          files: response.files
        }
      });

      showToast({ message: "Archivos subidos correctamente", type: "success" });
      navigate("/detection");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron subir los archivos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Subida de Excel</h2>
      <p className="lead">
        Puedes subir varios archivos .xls o .xlsx, incluso si cada banco usa un formato distinto.
      </p>
      <FileDropzone onFilesSelected={onFilesSelected} />
      <FileList files={selectedFiles} />
      {selectedFiles.length > 0 ? (
        <p className="muted">
          Archivos listos para subir: {selectedFiles.length}
        </p>
      ) : null}
      <ErrorAlert message={error} />
      {loading && <Loader text="Subiendo archivos..." />}
      <div className="actions-row">
        <button type="button" disabled={!selectedFiles.length || loading} onClick={onUpload}>
          Continuar
        </button>
      </div>
    </>
  );
}

export default UploadView;
