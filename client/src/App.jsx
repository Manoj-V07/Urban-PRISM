import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { StoreProvider } from "./app/store.jsx";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./app/router";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Grievances from "./pages/Greivances";
import MapView from "./pages/MapView";
import Analytics from "./pages/Analytics";
import Assets from "./pages/Assets";
import FieldWorkers from "./pages/FieldWorkers";
import TaskAssignments from "./pages/TaskAssignments";
import MyTasks from "./pages/MyTasks";
import SLAControlCenter from "./pages/SLAControlCenter";
import NotFound from "./pages/NotFound";
import PublicTracker from "./pages/PublicTracker";
import useAuth from "./hooks/useAuth";
import "./styles/index.css";

const getSafeRedirectPath = (value) => {
  if (!value || typeof value !== "string") return "/app";
  if (!value.startsWith("/") || value.startsWith("//")) return "/app";
  return value;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get("redirect"));

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={user ? <Navigate to={redirectTo} replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/app" /> : <Register />}
      />
      <Route path="/track" element={<PublicTracker />} />
      <Route path="/track/:grievanceId" element={<PublicTracker />} />
      <Route path="/grievances" element={<Navigate to="/app/grievances" replace />} />
      <Route path="/grievances/new" element={<Navigate to="/app/grievances/new" replace />} />
      <Route path="/map" element={<Navigate to="/app/map" replace />} />
      <Route path="/analytics" element={<Navigate to="/app/analytics" replace />} />
      <Route path="/assets" element={<Navigate to="/app/assets" replace />} />
      <Route path="/field-workers" element={<Navigate to="/app/field-workers" replace />} />
      <Route path="/task-assignments" element={<Navigate to="/app/task-assignments" replace />} />
      <Route path="/sla" element={<Navigate to="/app/sla" replace />} />
      <Route path="/my-tasks" element={<Navigate to="/app/my-tasks" replace />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            user?.role === "Admin" ? (
              <Dashboard />
            ) : user?.role === "FieldWorker" ? (
              <MyTasks />
            ) : (
              <Grievances />
            )
          }
        />
        <Route path="grievances" element={<Grievances />} />
        <Route path="grievances/new" element={<Grievances />} />
        <Route
          path="map"
          element={
            <ProtectedRoute adminOnly>
              <MapView />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <ProtectedRoute adminOnly>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="assets"
          element={
            <ProtectedRoute adminOnly>
              <Assets />
            </ProtectedRoute>
          }
        />
        <Route
          path="field-workers"
          element={
            <ProtectedRoute adminOnly>
              <FieldWorkers />
            </ProtectedRoute>
          }
        />
        <Route
          path="task-assignments"
          element={
            <ProtectedRoute adminOnly>
              <TaskAssignments />
            </ProtectedRoute>
          }
        />
        <Route
          path="sla"
          element={
            <ProtectedRoute adminOnly>
              <SLAControlCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-tasks"
          element={
            <ProtectedRoute>
              <MyTasks />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StoreProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </StoreProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
