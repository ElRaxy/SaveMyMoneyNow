// Archivo: frontend\src\routes\AppRouter.jsx. Codigo y comentarios en espanol.
import { Navigate, Route, Routes } from "react-router-dom";
import WelcomeView from "../views/WelcomeView.jsx";
import UploadView from "../views/UploadView.jsx";
import DetectionView from "../views/DetectionView.jsx";
import ColumnConfirmView from "../views/ColumnConfirmView.jsx";
import NormalizationView from "../views/NormalizationView.jsx";
import CategorizationView from "../views/CategorizationView.jsx";
import DuplicateResolutionView from "../views/DuplicateResolutionView.jsx";
import DashboardView from "../views/DashboardView.jsx";
import HistoryView from "../views/HistoryView.jsx";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<WelcomeView />} />
      <Route path="/upload" element={<UploadView />} />
      <Route path="/detection" element={<DetectionView />} />
      <Route path="/confirm" element={<ColumnConfirmView />} />
      <Route path="/normalization" element={<NormalizationView />} />
      <Route path="/categorization" element={<CategorizationView />} />
      <Route path="/duplicates" element={<DuplicateResolutionView />} />
      <Route path="/dashboard" element={<DashboardView />} />
      <Route path="/history" element={<HistoryView />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
