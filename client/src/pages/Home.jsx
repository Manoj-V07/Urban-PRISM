import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <span className="brand-icon">◆</span>
          <span className="brand-text">Urban PRISM</span>
        </div>
        <div className="landing-actions">
          {user ? (
            <Link className="btn btn-primary" to="/app">
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link className="btn btn-outline" to="/login">
                Login
              </Link>
              <Link className="btn btn-primary" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <p className="landing-badge">Smart Civic Operations Platform</p>
          <h1>Faster grievance resolution with AI, field intelligence, and transparent public tracking.</h1>
          <p>
            Urban PRISM helps municipalities detect risk clusters, prioritize critical issues,
            coordinate field workers, and keep citizens informed from complaint creation to closure.
          </p>

          <div className="landing-cta-row">
            {!user && (
              <>
                <Link className="btn btn-primary" to="/login">
                  Login to Platform
                </Link>
                <Link className="btn btn-outline" to="/register">
                  Create Account
                </Link>
              </>
            )}
            <Link className="btn btn-outline" to="/track">
              Track Grievance
            </Link>
            {user && (
              <Link className="btn btn-primary" to="/app">
                Go to Workspace
              </Link>
            )}
          </div>
        </section>

        <section className="landing-grid">
          <article className="landing-card">
            <h3>AI-Powered Grievance Intake</h3>
            <p>
              Auto classification, severity analysis, and duplicate warning improve data quality
              before it reaches operations.
            </p>
          </article>
          <article className="landing-card">
            <h3>Live Field Execution</h3>
            <p>
              Worker verification, assignment workflows, proof review, and live status board
              keep response teams accountable.
            </p>
          </article>
          <article className="landing-card">
            <h3>SLA and Escalation Control</h3>
            <p>
              Track SLA compliance, escalate at risk items, and monitor ward-level performance
              through scorecards.
            </p>
          </article>
          <article className="landing-card">
            <h3>Citizen Transparency</h3>
            <p>
              Public tracker and status updates provide clear visibility into grievance lifecycle
              and closure confidence.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
};

export default Home;
