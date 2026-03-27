import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { WORKER_CATEGORIES } from "../utils/constants";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    whatsappNumber: "",
    password: "",
    role: "Citizen",
    workerCategory: "",
  });
  const [pendingVerification, setPendingVerification] = useState(false);
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  const [pendingMessage, setPendingMessage] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await register(
        form.name,
        form.email,
        form.whatsappNumber,
        form.password,
        form.role,
        form.role === "FieldWorker" ? form.workerCategory : null
      );
      if (data?.role === "FieldWorker" && !data?.isVerified) {
        setPendingVerification(true);
      } else {
        navigate("/app");
      }
    } catch {
      /* error is set in context */
    }
  };

  if (pendingVerification) {
    return (
      <div className="auth-page">
        <div className="auth-layout">
          <aside className="auth-showcase">
            <p className="auth-showcase-tag">Registration Acknowledgement</p>
            <h2>Field Worker Verification Pending</h2>
            <p>
              Your profile has been submitted for administrative review. Access is enabled after verification.
            </p>
            <ul className="auth-showcase-list">
              <li>Professional category validation</li>
              <li>Deployment readiness confirmation</li>
              <li>Secure role-based onboarding</li>
            </ul>
          </aside>
          <div className="auth-card auth-card-wide">
            <div className="auth-header">
              <div className="gov-emblem auth-emblem">UP</div>
              <h1>Registration Successful</h1>
              <p className="auth-subtitle">Awaiting Admin Approval</p>
            </div>
            <div className="auth-pending-box">
              <div className="auth-pending-icon">⏳</div>
              <h3>Pending Verification</h3>
              <p>
                Your field worker account has been created successfully. An administrator will verify your account before task assignment access is enabled.
              </p>
              <Link to="/login" className="btn btn-primary btn-block">
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="auth-showcase">
          <p className="auth-showcase-tag">Citizen and Field Workforce Onboarding</p>
          <h2>Create Your Official Urban PRISM Account</h2>
          <p>
            Register to file complaints, monitor work progress or operate as a verified field worker for public infrastructure services.
          </p>
          <ul className="auth-showcase-list">
            <li>Role-based secure access</li>
            <li>Category-mapped worker onboarding</li>
            <li>Governance-ready audit trail</li>
          </ul>
          <Link className="btn btn-outline auth-home-link" to="/">
            Back to Home
          </Link>
        </aside>

        <div className="auth-card auth-card-wide">
          <div className="auth-header">
            <div className="gov-emblem auth-emblem">UP</div>
            <h1>Urban PRISM Registration</h1>
            <p className="auth-subtitle">Create your account</p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert alert-error">{error}</div>}
            {pendingMessage && (
              <div className="alert alert-success">{pendingMessage}</div>
            )}
            <div className="form-group">
              <label>Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name as per record"
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
                placeholder="name@domain.com"
                required
              />
            </div>
            <div className="form-group">
              <label>WhatsApp Number</label>
              <input
                type="tel"
                name="whatsappNumber"
                value={form.whatsappNumber}
                onChange={handleChange}
                placeholder="+91XXXXXXXXXX"
                required={form.role === "Citizen"}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
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
    </div>
  );
};

export default Register;
