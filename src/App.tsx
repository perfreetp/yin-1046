import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Approvals from "@/pages/Approvals";
import Resources from "@/pages/Resources";
import Conflicts from "@/pages/Conflicts";
import Statistics from "@/pages/Statistics";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/conflicts" element={<Conflicts />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
