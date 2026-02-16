// Archivo: frontend\src\views\CategorizationView.jsx. Codigo y comentarios en espanol.
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StepLayout from "../components/layout/StepLayout";
import CategoryEditorTable from "../components/category/CategoryEditorTable";
import RuleCreator from "../components/category/RuleCreator";
import Loader from "../components/common/Loader";
import ErrorAlert from "../components/common/ErrorAlert";
import { categorizePreview, checkDuplicates, commitBatch } from "../services/importApi";
import { useImportWizard } from "../state/ImportWizardContext";

function CategorizationView() {
  const navigate = useNavigate();
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
        setError(err.response?.data?.message || "No se pudo preparar la categorizacion");
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
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo completar la categorizacion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepLayout
      title="Categorizacion de gastos"
      subtitle="Se aplican reglas automaticas y puedes ajustar categoria por fila. Los cambios se pueden aprender como regla reutilizable."
    >
      <RuleCreator onCreateRule={onAddRule} />
      <CategoryEditorTable rows={rows} edits={edits} onEdit={onEdit} />
      <p className="muted">
        Marca "Aprender regla" para que la categoria se reutilice automaticamente en futuras importaciones.
      </p>
      <ErrorAlert message={error} />
      {loading && <Loader text="Procesando categorizacion..." />}
      <div className="actions-row">
        <button type="button" disabled={!canContinue} onClick={continueFlow}>
          Confirmar y revisar duplicados
        </button>
      </div>
    </StepLayout>
  );
}

export default CategorizationView;
