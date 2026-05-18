// Archivo: frontend\src\views\CategorizationView.jsx. Codigo y comentarios en espanol.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import CategoryEditorTable from "../components/category/CategoryEditorTable";
import RuleCreator from "../components/category/RuleCreator";
import Loader from "../components/common/Loader";
import ErrorAlert from "../components/common/ErrorAlert";
import { useToast } from "../components/common/Toast";
import { categorizePreview, checkDuplicates, commitBatch } from "../services/importApi";
import { useImportWizard } from "../state/ImportWizardContext";

function CategorizationView() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { state, dispatch, actionTypes } = useImportWizard();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [edits, setEdits] = useState([]);
  const [ruleActions, setRuleActions] = useState([]);

  useEffect(() => {
    if (!state.batchId || !state.normalizedPreview.length) {
      navigate("/normalization");
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        const data = await categorizePreview(state.batchId, edits);
        setRows(data.categorizedPreview || []);
        dispatch({ type: actionTypes.SET_CATEGORIZED, payload: data.categorizedPreview || [] });
      } catch (err) {
        setError(err.response?.data?.message || "No se pudo preparar la categorización.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [state.batchId, state.normalizedPreview.length, navigate]);

  const onEdit = (newEdit) => {
    setEdits((prev) => {
      const map = new Map(prev.map((item) => [item.tempId, item]));
      map.set(newEdit.tempId, { ...map.get(newEdit.tempId), ...newEdit });
      return Array.from(map.values());
    });
    // Aviso ligero: confirma al usuario que su cambio manual queda registrado
    // y se aplicara en el preview de la siguiente categorizacion.
    showToast({ message: "Categorización lista para confirmar", type: "info" });
  };

  const onAddRule = (ruleAction) => {
    setRuleActions((prev) => [...prev, ruleAction]);
  };

  const canContinue = useMemo(() => rows.length > 0 && !loading, [rows.length, loading]);

  const continueFlow = async () => {
    try {
      setLoading(true);
      setError("");

      const categorized = await categorizePreview(state.batchId, edits);
      dispatch({ type: actionTypes.SET_CATEGORIZED, payload: categorized.categorizedPreview || [] });
      dispatch({ type: actionTypes.SET_CATEGORY_EDITS, payload: edits });
      dispatch({ type: actionTypes.SET_RULE_ACTIONS, payload: ruleActions });

      const duplicateData = await checkDuplicates(state.batchId);
      dispatch({ type: actionTypes.SET_DUPLICATES, payload: duplicateData });

      if ((duplicateData.conflicts || []).length > 0) {
        navigate("/duplicates");
        return;
      }

      const summary = await commitBatch(state.batchId, {
        categoryEdits: edits,
        ruleActions,
        conflictResolutions: []
      });

      dispatch({ type: actionTypes.SET_COMMIT_SUMMARY, payload: summary });
      showToast({
        message: `Importación completada: ${summary.inserted} nuevos, ${summary.keptExisting} mantenidos, ${summary.replaced} reemplazados, ${summary.keptBoth} duplicados conservados`,
        type: "success",
        durationMs: 6000
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo completar la categorización.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2>Categorización de gastos</h2>
      <p className="lead">
        Se aplican reglas automáticas y puedes ajustar la categoría por fila. Los cambios se pueden aprender como
        regla reutilizable.
      </p>
      <RuleCreator onCreateRule={onAddRule} />
      <CategoryEditorTable rows={rows} edits={edits} onEdit={onEdit} />
      <p className="muted">
        Marca «Aprender regla» para que la categoría se reutilice automáticamente en futuras importaciones.
      </p>
      <ErrorAlert message={error} />
      {loading && <Loader text="Procesando categorización..." />}
      <div className="actions-row">
        <button type="button" disabled={!canContinue} onClick={continueFlow}>
          Confirmar y revisar duplicados
        </button>
      </div>
    </>
  );
}

export default CategorizationView;
