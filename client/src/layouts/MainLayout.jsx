import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import Chatbot from "../components/chat/Chatbot";

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">◆</span>
            <span className="brand-text">Urban PRISM</span>
          </Link>
        </div>
        <nav className="header-nav">
          {user?.role === "Admin" && (
            <>
              <Link
                to="/"
                className={`nav-link ${isActive("/") ? "active" : ""}`}
              >
                Dashboard
              </Link>
              <Link
                to="/grievances"
                className={`nav-link ${isActive("/grievances") ? "active" : ""}`}
              >
                Grievances
              </Link>
              <Link
                to="/map"
                className={`nav-link ${isActive("/map") ? "active" : ""}`}
              >
                Map
              </Link>
              <Link
                to="/analytics"
                className={`nav-link ${isActive("/analytics") ? "active" : ""}`}
              >
                Analytics
              </Link>
              <Link
                to="/assets"
                className={`nav-link ${isActive("/assets") ? "active" : ""}`}
              >
                Assets
              </Link>
              <Link
                to="/field-workers"
                className={`nav-link ${isActive("/field-workers") ? "active" : ""}`}
              >
                Workers
              </Link>
              <Link
                to="/task-assignments"
                className={`nav-link ${isActive("/task-assignments") ? "active" : ""}`}
              >
                Tasks
              </Link>
            </>
          )}
          {user?.role === "FieldWorker" && (
            <>
              <Link
                to="/"
                className={`nav-link ${isActive("/") ? "active" : ""}`}
              >
                My Tasks
              </Link>
            </>
          )}
          {user?.role === "Citizen" && (
            <>
              <Link
                to="/"
                className={`nav-link ${isActive("/") ? "active" : ""}`}
              >
                My Complaints
              </Link>
              <Link
                to="/grievances/new"
                className={`nav-link ${isActive("/grievances/new") ? "active" : ""}`}
              >
                File Complaint
              </Link>
            </>
          )}
          {user?.role === "FieldWorker" && (
            <>
              <Link
                to="/"
                className={`nav-link ${isActive("/") ? "active" : ""}`}
              >
                My Tasks
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
