import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== "Admin")
    return <Navigate to="/" replace />;
  // Block unverified field workers
  if (user.role === "FieldWorker" && user.isVerified === false) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <h2>Account Pending Verification</h2>
        <p style={{ color: "#6b7280", maxWidth: "400px", margin: "1rem auto" }}>
          Your field worker account is awaiting admin verification.
          You will be able to access your tasks once approved.
        </p>
      </div>
    );
  }
  return children;
};

export default ProtectedRoute;
