import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import "./i18n";

// Layout
import MainLayout from "./components/layout/MainLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentForm from "./pages/StudentForm";
import StudentDetails from "./pages/StudentDetails";
import Teachers from "./pages/Teachers";
import TeacherForm from "./pages/TeacherForm";
import Halaqas from "./pages/Halaqas";
import HalaqaForm from "./pages/HalaqaForm";
import HalaqaDetails from "./pages/HalaqaDetails";
import Evaluations from "./pages/Evaluations";
import Sessions from "./pages/Sessions";
import SessionDetails from "./pages/SessionDetails";
import SessionForm from "./pages/SessionForm";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import EvaluationDetails from "./pages/EvaluationDetails";
import EvaluationForm from "./pages/EvaluationForm";
import Certificates from "./pages/Certificates";
import Configuration from "./pages/Configuration";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route
          path="students"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff", "teacher", "exam_teacher"]}>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="students/new"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <StudentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="students/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <StudentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="students/:id"
          element={
            <ProtectedRoute allowedRoles={["admin", "student"]}>
              <StudentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="teachers"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <Teachers />
            </ProtectedRoute>
          }
        />
        <Route
          path="teachers/new"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <TeacherForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="teachers/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <TeacherForm />
            </ProtectedRoute>
          }
        />
        <Route path="halaqas" element={<Halaqas />} />
        <Route
          path="halaqas/new"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <HalaqaForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="halaqas/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <HalaqaForm />
            </ProtectedRoute>
          }
        />
        <Route path="halaqas/:id" element={<HalaqaDetails />} />
        <Route path="evaluations" element={<Evaluations />} />
        <Route path="evaluations/new" element={<EvaluationForm />} />
        <Route path="evaluations/:id" element={<EvaluationDetails />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="sessions/new" element={<SessionForm />} />
        <Route path="sessions/:id" element={<SessionDetails />} />
        <Route
          path="configuration"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <Configuration />
            </ProtectedRoute>
          }
        />
        <Route
          path="error-types"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <Navigate to="/configuration" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff", "teacher"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="certificates"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Certificates />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Users />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              style: {
                borderRadius: "12px",
              },
            }}
          />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
