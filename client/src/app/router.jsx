import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = ({ children, adminOnly = false, workerOnly = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "Admin")
    return <Navigate to="/" replace />;
  if (workerOnly && user.role !== "FieldWorker")
    return <Navigate to="/" replace />;
  return children;
};

export default ProtectedRoute;
