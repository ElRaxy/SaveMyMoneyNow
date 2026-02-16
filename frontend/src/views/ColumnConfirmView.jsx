// Archivo: frontend/src/views/ColumnConfirmView.jsx. Codigo y comentarios en espanol.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepLayout from "../components/layout/StepLayout";
import ColumnMappingForm from "../components/mapping/ColumnMappingForm";
import PreviewTable from "../components/table/PreviewTable";
import ErrorAlert from "../components/common/ErrorAlert";
import Loader from "../components/common/Loader";
import { confirmColumns, previewMapping } from "../services/importApi";
import { useImportWizard } from "../state/ImportWizardContext";

const inferDefaultOrigin = (fileName = "") => {
  const normalized = fileName.toLowerCase();
  if (normalized.includes("cuenta")) return "cuenta";
  if (normalized.includes("tarjeta")) return "tarjeta";
  return "otro";
};

const buildMappedPreviewRows = (detection, currentMapping) => {
  if (!detection || !currentMapping) return [];
  const sourceRows = detection.previewRows || [];
  const headers = detection.headers || [];

  const fechaIndex = headers.indexOf(currentMapping.mapping?.fecha);
  const conceptoIndex = headers.indexOf(currentMapping.mapping?.concepto);
  const importeIndex = headers.indexOf(currentMapping.mapping?.importe);

  return sourceRows.map((row) => ({
    fecha: Array.isArray(row) ? (fechaIndex >= 0 ? row[fechaIndex] : "") : "",
    concepto: Array.isArray(row) ? (conceptoIndex >= 0 ? row[conceptoIndex] : "") : "",
    importe: Array.isArray(row) ? (importeIndex >= 0 ? row[importeIndex] : "")
      : "",
    origen: currentMapping.origen
  }));
};

function ColumnConfirmView() {
  const navigate = useNavigate();
  const { state, dispatch, actionTypes } = useImportWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsReupload, setNeedsReupload] = useState(false);
  const [previewByFile, setPreviewByFile] = useState({});
  const [previewLoadingByFile, setPreviewLoadingByFile] = useState({});
  const previewDebounceRef = useRef({});
  const previewTokenRef = useRef({});

  const defaultMappings = useMemo(() => {
    const object = {};
    (state.detections || []).forEach((detection) => {
      const fileInfo = state.uploadedFiles.find((item) => item.fileId === detection.fileId);
      object[detection.fileId] = {
        fileId: detection.fileId,
        headerRow: detection.headerRowDetected,
        origen: inferDefaultOrigin(fileInfo?.fileName || ""),
        mapping: {
          fecha: detection.possibleColumns?.fecha || detection.headers?.[0] || "",
          concepto: detection.possibleColumns?.concepto || detection.headers?.[1] || "",
          importe: detection.possibleColumns?.importe || detection.headers?.[2] || ""
        }
      };
    });
    return object;
  }, [state.detections, state.uploadedFiles]);

  const [mappings, setMappings] = useState(defaultMappings);

  useEffect(() => {
    if (!state.batchId || !state.detections.length) {
      navigate("/detection");
    }
  }, [state.batchId, state.detections.length, navigate]);

  useEffect(() => {
    setMappings(defaultMappings);
    setPreviewByFile({});
    setNeedsReupload(false);
  }, [defaultMappings]);

  useEffect(() => {
    const entries = Object.values(defaultMappings || {});
    if (!state.batchId || !entries.length || needsReupload) return;

    entries.forEach((fileConfig) => {
      loadPreviewForFile(fileConfig.fileId, fileConfig, 0);
    });
  }, [state.batchId, defaultMappings, needsReupload]);

  useEffect(
    () => () => {
      Object.values(previewDebounceRef.current).forEach((timer) => clearTimeout(timer));
    },
    []
  );

  const isPreviewReady = (config) =>
    Boolean(
      config &&
      config.fileId &&
      Number(config.headerRow) > 0 &&
      config.mapping?.fecha &&
      config.mapping?.concepto &&
      config.mapping?.importe
    );

  const handleMissingTemporaryFiles = () => {
    Object.values(previewDebounceRef.current).forEach((timer) => clearTimeout(timer));
    setNeedsReupload(true);
    setError("Los archivos temporales de este lote ya no existen. Debes subir los Excel de nuevo.");
  };

  const loadPreviewForFile = (fileId, fileConfig, delayMs = 260) => {
    if (!state.batchId || !isPreviewReady(fileConfig) || needsReupload) return;

    if (previewDebounceRef.current[fileId]) {
      clearTimeout(previewDebounceRef.current[fileId]);
    }

    previewDebounceRef.current[fileId] = setTimeout(async () => {
      const token = `${Date.now()}-${Math.random()}`;
      previewTokenRef.current[fileId] = token;
      setPreviewLoadingByFile((prev) => ({ ...prev, [fileId]: true }));

      try {
        const data = await previewMapping(state.batchId, fileConfig);
        if (previewTokenRef.current[fileId] !== token) return;
        setPreviewByFile((prev) => ({ ...prev, [fileId]: data }));
      } catch (err) {
        if (previewTokenRef.current[fileId] !== token) return;
        if (err.response?.status === 410) {
          handleMissingTemporaryFiles();
          return;
        }
        setError(err.response?.data?.message || "No se pudo actualizar la previsualizacion del archivo");
      } finally {
        if (previewTokenRef.current[fileId] === token) {
          setPreviewLoadingByFile((prev) => ({ ...prev, [fileId]: false }));
        }
      }
    }, delayMs);
  };

  const updateMapping = (fileId, value) => {
    setMappings((prev) => ({
      ...prev,
      [fileId]: value
    }));

    loadPreviewForFile(fileId, value);
  };

  const submitMappings = async () => {
    try {
      setLoading(true);
      setError("");
      const files = Object.values(mappings);
      const result = await confirmColumns(state.batchId, files);

      dispatch({ type: actionTypes.SET_MAPPINGS, payload: mappings });
      dispatch({ type: actionTypes.SET_NORMALIZED, payload: result });

      navigate("/normalization");
    } catch (err) {
      if (err.response?.status === 410) {
        handleMissingTemporaryFiles();
        return;
      }
      setError(err.response?.data?.message || "No se pudieron confirmar las columnas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepLayout
      title="Confirmacion manual de columnas"
      subtitle="Revisa y corrige el mapeo antes de normalizar. Esta confirmacion hace la importacion robusta."
    >
      {(state.detections || []).map((detection) => {
        const fileInfo = state.uploadedFiles.find((item) => item.fileId === detection.fileId);
        const previewData = previewByFile[detection.fileId];
        const previewRows = previewData?.previewRows || buildMappedPreviewRows(detection, mappings[detection.fileId]);

        return (
          <div key={detection.fileId}>
            <ColumnMappingForm
              file={{ ...fileInfo, fileId: detection.fileId }}
              detection={detection}
              value={mappings[detection.fileId]}
              onChange={updateMapping}
            />

            <article className="card">
              <p>Preview de importacion con el mapeo seleccionado:</p>
              {previewLoadingByFile[detection.fileId] ? <Loader text="Actualizando preview..." /> : null}
              {previewData ? (
                <p className="muted">
                  Filas validas: {previewData.totalPreviewRows} | Filas invalidas: {previewData.totalInvalidRows}
                </p>
              ) : null}
              <PreviewTable
                headers={["fecha", "concepto", "importe", "origen"]}
                rows={previewRows}
              />
            </article>
          </div>
        );
      })}

      <ErrorAlert message={error} />
      {loading && <Loader text="Normalizando registros..." />}

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
        <button type="button" disabled={loading || needsReupload} onClick={submitMappings}>
          Confirmar y continuar
        </button>
      </div>
    </StepLayout>
  );
}

export default ColumnConfirmView;
