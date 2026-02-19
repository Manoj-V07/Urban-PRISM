import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Citizen",
    phone: "",
  });
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
        form.password,
        form.role,
        form.phone
      );
      // FieldWorkers get a pending message instead of redirect
      if (form.role === "FieldWorker" && !data.token) {
        setPendingMessage(
          data.message || "Registration successful. Your account is pending admin verification."
        );
      } else {
        navigate("/");
      }
    } catch {
      /* error is set in context */
    }
  };

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
          {pendingMessage && (
            <div className="alert alert-success">{pendingMessage}</div>
          )}
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
              <label>Phone Number</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
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
