import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { WORKER_CATEGORIES } from "../utils/constants";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Citizen",
    workerCategory: "",
  });
  const [pendingVerification, setPendingVerification] = useState(false);
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await register(
        form.name,
        form.email,
        form.password,
        form.role,
        form.role === "FieldWorker" ? form.workerCategory : null
      );
      if (data?.role === "FieldWorker" && !data?.isVerified) {
        setPendingVerification(true);
      } else {
        navigate("/");
      }
    } catch {
      /* error is set in context */
    }
  };

  if (pendingVerification) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <span className="brand-icon lg">◆</span>
            <h1>Urban PRISM</h1>
            <p className="auth-subtitle">Registration Successful</p>
          </div>
          <div style={{ textAlign: "center", padding: "1.5rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⏳</div>
            <h3>Pending Verification</h3>
            <p style={{ color: "#6b7280", margin: "1rem 0" }}>
              Your field worker account has been created successfully.
              An administrator will review and verify your account before
              you can receive task assignments.
            </p>
            <Link to="/login" className="btn btn-primary btn-block">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="brand-icon lg">◆</span>
          <h1>Urban PRISM</h1>
          <p className="auth-subtitle">Create your account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="Citizen">Citizen</option>
              <option value="FieldWorker">Field Worker</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          {form.role === "FieldWorker" && (
            <div className="form-group">
              <label>Professional Category</label>
              <select
                name="workerCategory"
                value={form.workerCategory}
                onChange={handleChange}
                required
              >
                <option value="">Select category...</option>
                {WORKER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
