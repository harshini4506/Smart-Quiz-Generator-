import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppProvider, useAppContext } from "./context/AppContext";
import { useAuthState } from "./hooks/useAuth";
import ChatbotPage from "./pages/ChatbotPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import QuizPage from "./pages/QuizPage";
import ResultsPage from "./pages/ResultsPage";
import SignupPage from "./pages/SignupPage";
import StudentAssignmentsPage from "./pages/StudentAssignmentsPage";
import FacultyAssignmentsPage from "./pages/FacultyAssignmentsPage";
import SummaryPage from "./pages/SummaryPage";
import UploadPage from "./pages/UploadPage";

function AppShell() {
  const { user, loginState, logoutState } = useAuthState();
  const { state, dispatch } = useAppContext();

  const onUploaded = (docId) => {
    dispatch({ type: "SET_SELECTED_DOC", payload: docId });
    localStorage.setItem("selected_doc_id", docId);
  };

  const setResultData = (payload) => {
    dispatch({ type: "SET_RESULT_DATA", payload });
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <Navbar user={user} onLogout={logoutState} />
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={loginState} />} />
          <Route path="/signup" element={<SignupPage onLogin={loginState} />} />

          <Route path="/dashboard" element={<ProtectedRoute user={user}><DashboardPage user={user} /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute user={user} roles={["student", "faculty"]}><UploadPage onUploaded={onUploaded} /></ProtectedRoute>} />
          <Route path="/faculty/assignments" element={<ProtectedRoute user={user} roles={["faculty"]}><FacultyAssignmentsPage /></ProtectedRoute>} />

          <Route path="/student/assignments" element={<ProtectedRoute user={user} roles={["student"]}><StudentAssignmentsPage /></ProtectedRoute>} />
          <Route path="/quiz" element={<ProtectedRoute user={user} roles={["student"]}><QuizPage selectedDocId={state.selectedDocId} setResultData={setResultData} /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute user={user} roles={["student"]}><ResultsPage resultData={state.resultData} /></ProtectedRoute>} />
          <Route path="/summary" element={<ProtectedRoute user={user} roles={["student"]}><SummaryPage selectedDocId={state.selectedDocId} /></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute user={user} roles={["student"]}><ChatbotPage selectedDocId={state.selectedDocId} /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute user={user}><HistoryPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
