import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth";
import Chatbot from "../components/chat/Chatbot";
import LanguageSelector from "../components/common/LanguageSelector";

const MainLayout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = mobileNavOpen ? "hidden" : prevOverflow;
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isAdmin, mobileNavOpen]);

  const handleLogout = () => {
    logout();
    window.location.assign("/");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="app-layout">
      <header className={`app-header ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="header-brand">
          <Link to="/app" className="brand-link">
            <span className="brand-icon">◆</span>
            <span className="brand-text">Urban PRISM</span>
          </Link>
        </div>
        {isAdmin ? (
          <>
            <button
              type="button"
              className="header-menu-toggle"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileNavOpen}
              aria-controls="admin-sidebar"
            >
              ☰
            </button>
            {mobileNavOpen && (
              <button
                type="button"
                className="header-sidebar-overlay"
                aria-label="Close sidebar"
                onClick={() => setMobileNavOpen(false)}
              />
            )}
            <aside
              id="admin-sidebar"
              className={`header-mobile-panel ${mobileNavOpen ? "open" : ""}`}
              aria-hidden={!mobileNavOpen}
            >
              <div className="header-sidebar-head">
                <div className="header-sidebar-account">
                  <span className="header-sidebar-title">{user?.name || "Account"}</span>
                  <div className="header-sidebar-meta">
                    <LanguageSelector className="header-language-switcher" />
                    <span className="user-role badge">{user?.role}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="header-sidebar-close"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close navigation"
                >
                  ✕
                </button>
              </div>
              <nav className="header-nav">
                <Link
                  to="/app"
                  className={`nav-link ${isActive("/app") ? "active" : ""}`}
                >
                  {t("dashboard")}
                </Link>
                <Link
                  to="/app/grievances"
                  className={`nav-link ${isActive("/app/grievances") ? "active" : ""}`}
                >
                  {t("grievances")}
                </Link>
                <Link
                  to="/app/map"
                  className={`nav-link ${isActive("/app/map") ? "active" : ""}`}
                >
                  {t("map")}
                </Link>
                <Link
                  to="/app/analytics"
                  className={`nav-link ${isActive("/app/analytics") ? "active" : ""}`}
                >
                  {t("analytics")}
                </Link>
                <Link
                  to="/app/assets"
                  className={`nav-link ${isActive("/app/assets") ? "active" : ""}`}
                >
                  {t("assets")}
                </Link>
                <Link
                  to="/app/field-workers"
                  className={`nav-link ${isActive("/app/field-workers") ? "active" : ""}`}
                >
                  {t("workers")}
                </Link>
                <Link
                  to="/app/task-assignments"
                  className={`nav-link ${isActive("/app/task-assignments") ? "active" : ""}`}
                >
                  {t("tasks")}
                </Link>
                <Link
                  to="/app/sla"
                  className={`nav-link ${isActive("/app/sla") ? "active" : ""}`}
                >
                  {t("sla")}
                </Link>
                <button
                  type="button"
                  className="nav-link nav-logout-link"
                  onClick={handleLogout}
                >
                  {t("logout")}
                </button>
              </nav>
            </aside>
          </>
        ) : (
          <div className="header-user header-user-inline">
            <LanguageSelector className="header-language-switcher" />
            <span className="user-name">{user?.name}</span>
            <span className="user-role badge">{user?.role}</span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              {t("logout")}
            </button>
          </div>
        )}
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <Chatbot />
    </div>
  );
};

export default MainLayout;
