// Archivo: frontend\src\views\DetectionView.jsx. Codigo y comentarios en espanol.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DetectionCard from "../components/detection/DetectionCard";
import ErrorAlert from "../components/common/ErrorAlert";
import Loader from "../components/common/Loader";
import { detectBatch } from "../services/importApi";
import { useImportWizard } from "../state/ImportWizardContext";

function DetectionView() {
  const navigate = useNavigate();
  const { state, dispatch, actionTypes } = useImportWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsReupload, setNeedsReupload] = useState(false);

  useEffect(() => {
    if (!state.batchId) {
      navigate("/upload");
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        setNeedsReupload(false);
        const data = await detectBatch(state.batchId);
        dispatch({ type: actionTypes.SET_DETECTIONS, payload: data.detections || [] });
      } catch (err) {
        if (err.response?.status === 410) {
          setNeedsReupload(true);
          setError("Los archivos temporales de este lote ya no existen. Debes subir los Excel de nuevo.");
          return;
        }
        setError(err.response?.data?.message || "No se pudo detectar la estructura de los archivos.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [state.batchId, dispatch, actionTypes, navigate]);

  return (
    <>
      <h2>Detección inteligente de columnas</h2>
      <p className="lead">
        Analizamos cada archivo para localizar la fila de cabeceras y proponer Fecha, Concepto e Importe.
      </p>
      {loading && <Loader text="Analizando archivos..." />}
      <ErrorAlert message={error} />
      {(state.detections || []).map((detection) => {
        const file = state.uploadedFiles.find((item) => item.fileId === detection.fileId);
        return <DetectionCard key={detection.fileId} fileName={file?.fileName || detection.fileId} detection={detection} />;
      })}
      {!loading && state.detections.length > 0 ? (
        <p className="muted">Archivos analizados: {state.detections.length}</p>
      ) : null}

      <div className="actions-row">
        {needsReupload ? (
          <button
            type="button"
            onClick={() => {
              dispatch({ type: actionTypes.RESET });
              navigate("/upload");
            }}
          >
            Volver a subir archivos
          </button>
        ) : null}
        <button
          type="button"
          disabled={!state.detections.length || loading || needsReupload}
          onClick={() => navigate("/confirm")}
        >
          Confirmar columnas
        </button>
      </div>
    </>
  );
}

export default DetectionView;
