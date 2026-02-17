import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { StoreProvider } from "./app/store.jsx";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./app/router";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Grievances from "./pages/Greivances";
import MapView from "./pages/MapView";
import Analytics from "./pages/Analytics";
import Assets from "./pages/Assets";
import NotFound from "./pages/NotFound";
import useAuth from "./hooks/useAuth";
import "./styles/index.css";

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/" /> : <Register />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            user?.role === "Admin" ? <Dashboard /> : <Grievances />
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
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
