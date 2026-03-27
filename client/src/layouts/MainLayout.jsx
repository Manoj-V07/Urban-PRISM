import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Chatbot from "../components/chat/Chatbot";

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.assign("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <Link to="/app" className="brand-link">
            <span className="brand-icon">◆</span>
            <span className="brand-text">Urban PRISM</span>
          </Link>
        </div>
        <nav className="header-nav">
          {user?.role === "Admin" && (
            <>
              <Link
                to="/app"
                className={`nav-link ${isActive("/app") ? "active" : ""}`}
              >
                Dashboard
              </Link>
              <Link
                to="/app/grievances"
                className={`nav-link ${isActive("/app/grievances") ? "active" : ""}`}
              >
                Grievances
              </Link>
              <Link
                to="/app/map"
                className={`nav-link ${isActive("/app/map") ? "active" : ""}`}
              >
                Map
              </Link>
              <Link
                to="/app/analytics"
                className={`nav-link ${isActive("/app/analytics") ? "active" : ""}`}
              >
                Analytics
              </Link>
              <Link
                to="/app/assets"
                className={`nav-link ${isActive("/app/assets") ? "active" : ""}`}
              >
                Assets
              </Link>
              <Link
                to="/app/field-workers"
                className={`nav-link ${isActive("/app/field-workers") ? "active" : ""}`}
              >
                Workers
              </Link>
              <Link
                to="/app/task-assignments"
                className={`nav-link ${isActive("/app/task-assignments") ? "active" : ""}`}
              >
                Tasks
              </Link>
              <Link
                to="/app/sla"
                className={`nav-link ${isActive("/app/sla") ? "active" : ""}`}
              >
                SLA
              </Link>
            </>
          )}
          {user?.role === "FieldWorker" && (
            <>
              <Link
                to="/app"
                className={`nav-link ${isActive("/app") ? "active" : ""}`}
              >
                My Tasks
              </Link>
            </>
          )}
          {user?.role === "Citizen" && (
            <>
              <Link
                to="/app"
                className={`nav-link ${isActive("/app") ? "active" : ""}`}
              >
                My Complaints
              </Link>
            </>
          )}
        </nav>
        <div className="header-user">
          <span className="user-name">{user?.name}</span>
          <span className="user-role badge">{user?.role}</span>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <Chatbot />
    </div>
  );
};

export default MainLayout;
