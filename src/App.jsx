import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ThemeProvider } from "./utils/theme";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const BugDetails = lazy(() => import("./pages/BugDetails"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const TeamDetail = lazy(() => import("./pages/TeamDetail"));
const Kanban = lazy(() => import("./pages/Kanban"));
const Analytics = lazy(() => import("./pages/Analytics"));
const TeamWorkspace = lazy(() => import("./pages/TeamWorkspace"));
const ActivityFeed = lazy(() => import("./pages/ActivityFeed"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense
          fallback={
            <div className="loading-screen">
              <div className="spinner" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bugs/:id"
              element={
                <ProtectedRoute>
                  <BugDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams"
              element={
                <ProtectedRoute>
                  <TeamPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/:id/workspace"
              element={
                <ProtectedRoute>
                  <TeamWorkspace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teams/:id"
              element={
                <ProtectedRoute>
                  <TeamDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <ActivityFeed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kanban"
              element={
                <ProtectedRoute>
                  <Kanban />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
