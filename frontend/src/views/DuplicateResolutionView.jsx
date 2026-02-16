// Archivo: frontend\src\views\DuplicateResolutionView.jsx. Codigo y comentarios en espanol.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepLayout from "../components/layout/StepLayout";
import ConflictTable from "../components/duplicate/ConflictTable";
import ErrorAlert from "../components/common/ErrorAlert";
import Loader from "../components/common/Loader";
import { commitBatch } from "../services/importApi";
import { useImportWizard } from "../state/ImportWizardContext";

function DuplicateResolutionView() {
  const navigate = useNavigate();
  const { state, dispatch, actionTypes } = useImportWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const conflicts = state.duplicates?.conflicts || [];

  const [resolutions, setResolutions] = useState({});

  useEffect(() => {
    if (!state.batchId) {
      navigate("/upload");
      return;
    }

    if (!conflicts.length) {
      navigate("/dashboard");
      return;
    }

    const defaults = {};
    conflicts.forEach((conflict) => {
      defaults[conflict.conflictKey] = conflict.defaultAction;
    });
    setResolutions(defaults);
  }, [conflicts, state.batchId, navigate]);

  const updateResolution = (conflictKey, action) => {
    setResolutions((prev) => ({
      ...prev,
      [conflictKey]: action
    }));
  };

  const conflictResolutions = useMemo(
    () =>
      conflicts.map((conflict) => ({
        conflictKey: conflict.conflictKey,
        action: resolutions[conflict.conflictKey] || conflict.defaultAction
      })),
    [conflicts, resolutions]
  );

  const confirm = async () => {
    try {
      setLoading(true);
      const summary = await commitBatch(state.batchId, {
        categoryEdits: state.categoryEdits,
        ruleActions: state.ruleActions,
        conflictResolutions
      });

      dispatch({ type: actionTypes.SET_COMMIT_SUMMARY, payload: summary });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron resolver los conflictos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepLayout
      title="Resolucion de duplicados"
      subtitle="Antes de guardar, revisa conflictos por fecha+concepto y decide que hacer en cada caso."
    >
      <p>
        Conflictos detectados: {conflicts.length}. Elige si quieres mantener el existente, reemplazarlo o guardar
        ambos.
      </p>
      <p className="muted">
        Sugerencia automatica: mismo importe = mantener existente. Importe distinto = mantener ambos.
      </p>
      <ConflictTable conflicts={conflicts} resolutions={resolutions} onChange={updateResolution} />
      <ErrorAlert message={error} />
      {loading && <Loader text="Guardando resoluciones..." />}
      <div className="actions-row">
        <button type="button" disabled={loading || !conflicts.length} onClick={confirm}>
          Confirmar resoluciones
        </button>
      </div>
    </StepLayout>
  );
}

export default DuplicateResolutionView;
