import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const getSafeRedirectPath = (value) => {
  if (!value || typeof value !== "string") return "/app";
  if (!value.startsWith("/") || value.startsWith("//")) return "/app";
  return value;
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get("redirect"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch {
      /* error is set in context */
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <aside className="auth-showcase">
          <p className="auth-showcase-tag">National Civic Service Portal</p>
          <h2>Secure Government Access</h2>
          <p>
            Sign in to manage grievances, monitor field response and deliver accountable citizen services.
          </p>
          <ul className="auth-showcase-list">
            <li>Complaint lifecycle oversight</li>
            <li>Ward-level operations dashboard</li>
            <li>Geo-verified maintenance completion</li>
          </ul>
          <Link className="btn btn-outline auth-home-link" to="/">
            Back to Home
          </Link>
        </aside>

        <div className="auth-card auth-card-wide">
          <div className="auth-header">
            <div className="gov-emblem auth-emblem">UP</div>
            <h1>Urban PRISM Login</h1>
            <p className="auth-subtitle">
              Public Risk and Infrastructure Smart Monitor
            </p>
          </div>
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@department.gov.in"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="auth-footer">
            Don&apos;t have an account?{" "}
            <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
