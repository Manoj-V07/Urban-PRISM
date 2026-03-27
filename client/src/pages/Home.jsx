import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth";
import LanguageSelector from "../components/common/LanguageSelector";

const Home = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Parliament and Public Governance",
      subtitle: "Digital civic systems aligned with accountable government service delivery",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/New_Parliament_Building,_New_Delhi.jpg",
      source: "Wikimedia Commons",
    },
    {
      title: "Kartavya Path and Citizen Spaces",
      subtitle: "Public grievance management integrated with city-level governance corridors",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/India_Gate_from_Rajpath.jpg",
      source: "Wikimedia Commons",
    },
    {
      title: "Service, Safety and Infrastructure",
      subtitle: "Operations visibility for roads, drainage, utilities and public maintenance",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/India_Gate_For_Soldiers.JPG",
      source: "Wikimedia Commons",
    },
    {
      title: "National Urban Civic Heritage",
      subtitle: "Modern complaint workflows backed by institutional public administration",
      image: "https://commons.wikimedia.org/wiki/Special:FilePath/Canopy_behind_India_Gate.jpg",
      source: "Wikimedia Commons",
    },
  ];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [slides.length]);

  const handleHomeLogout = () => {
    logout();
    window.location.assign("/");
  };

  return (
    <div className="landing-page">
      <header className="landing-header gov-header">
        <div className="landing-brand gov-brand-wrap">
          <div className="gov-emblem">UP</div>
          <div>
            <p className="gov-brand-top">Government Civic Technology Initiative</p>
            <span className="brand-text">Urban PRISM</span>
          </div>
        </div>
        <div className="landing-actions">
          <LanguageSelector className="landing-language-switcher" />
          {user ? (
            <>
              <Link className="btn btn-outline" to="/app">
                {t("openDashboard")}
              </Link>
              <button type="button" className="btn btn-primary" onClick={handleHomeLogout}>
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline" to="/login">
                {t("login")}
              </Link>
              <Link className="btn btn-primary" to="/register">
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero gov-hero">
          <div className="gov-hero-left">
            <p className="landing-badge gov-badge">{t("smartCivicPlatform")}</p>
            <h1>Digital Public Infrastructure for Responsive Urban Governance</h1>
            <p>
              Urban PRISM enables civic bodies to register, prioritize and resolve public grievances through
              transparent operations, geo-verified field completion and citizen-facing tracking workflows.
            </p>

            <div className="landing-cta-row">
              {!user && (
                <>
                  <Link className="btn btn-primary" to="/login">
                    {t("login")}
                  </Link>
                  <Link className="btn btn-outline" to="/register">
                    {t("register")}
                  </Link>
                </>
              )}
              <Link className="btn btn-outline" to="/track">
                {t("trackComplaint")}
              </Link>
              {user && (
                <Link className="btn btn-primary" to="/app">
                  {t("goToWorkspace")}
                </Link>
              )}
            </div>

            <div className="gov-metrics">
              <div className="gov-metric-card">
                <strong>24x7</strong>
                <span>Citizen service window</span>
              </div>
              <div className="gov-metric-card">
                <strong>Ward-wise</strong>
                <span>Operational command view</span>
              </div>
              <div className="gov-metric-card">
                <strong>Geo-verified</strong>
                <span>Field completion evidence</span>
              </div>
            </div>
          </div>

          <div className="gov-hero-slider" aria-label="Government initiative highlights">
            {slides.map((slide, idx) => (
              <article
                key={slide.title}
                className={`gov-slide ${idx === activeSlide ? "active" : ""}`}
                aria-hidden={idx !== activeSlide}
              >
                <img src={slide.image} alt={slide.title} />
                <div className="gov-slide-overlay">
                  <h3>{slide.title}</h3>
                  <p>{slide.subtitle}</p>
                  <span className="gov-slide-source">Image source: {slide.source}</span>
                </div>
              </article>
            ))}

            <div className="gov-slide-dots" role="tablist" aria-label="Slider controls">
              {slides.map((slide, idx) => (
                <button
                  key={`${slide.title}-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeSlide}
                  className={`gov-dot ${idx === activeSlide ? "active" : ""}`}
                  onClick={() => setActiveSlide(idx)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="landing-grid">
          <article className="landing-card">
            <h3>Centralized Complaint Intake</h3>
            <p>Voice-enabled filing, image validation and multilingual support for inclusive citizen reporting.</p>
          </article>
          <article className="landing-card">
            <h3>Field Response Visibility</h3>
            <p>Task assignment, start tracking and proof upload with location-aware verification.</p>
          </article>
          <article className="landing-card">
            <h3>Governance SLA Control</h3>
            <p>Monitor timelines, escalation paths and risk alerts aligned to public service standards.</p>
          </article>
          <article className="landing-card">
            <h3>Transparent Citizen Journey</h3>
            <p>Track complaint progress from registration to closure with status and audit trail.</p>
          </article>
        </section>

        <section className="gov-bottom-ribbon">
          <p>
            Built for municipal corporations, smart city missions and public works departments to improve grievance turnaround and service quality.
          </p>
        </section>

        <section className="gov-content-stack">
          <article className="gov-content-card gov-priority-card">
            <div className="gov-section-head">
              <h2>National Urban Governance Priorities</h2>
              <p>Designed to support frontline execution and supervisory decision-making.</p>
            </div>
            <div className="gov-priority-grid">
              <div className="gov-priority-item">
                <h3>Citizen-Centric Intake</h3>
                <p>Multi-language complaint filing, structured categorization and transparent status communication.</p>
              </div>
              <div className="gov-priority-item">
                <h3>Evidence-Based Field Closure</h3>
                <p>Geo-linked completion proof, image verification and administrative review before resolution.</p>
              </div>
              <div className="gov-priority-item">
                <h3>SLA Compliance Management</h3>
                <p>Escalation tracking, breach risk visibility and accountability dashboards for departments.</p>
              </div>
              <div className="gov-priority-item">
                <h3>Data-Driven Urban Planning</h3>
                <p>Cluster and trend analytics to support preventive maintenance and resource allocation.</p>
              </div>
            </div>
          </article>

          <article className="gov-content-card gov-workflow-card">
            <div className="gov-section-head">
              <h2>Operational Workflow</h2>
              <p>Standardized grievance lifecycle for municipal service response.</p>
            </div>
            <ol className="gov-workflow-list">
              <li>
                <span className="step-index">01</span>
                <div>
                  <h4>Complaint Registration</h4>
                  <p>Citizen submits issue details, media evidence and location coordinates.</p>
                </div>
              </li>
              <li>
                <span className="step-index">02</span>
                <div>
                  <h4>Department Routing</h4>
                  <p>System classifies complaint category and routes to responsible field operations team.</p>
                </div>
              </li>
              <li>
                <span className="step-index">03</span>
                <div>
                  <h4>Field Execution</h4>
                  <p>Assigned worker starts task with live location and records completion evidence on site.</p>
                </div>
              </li>
              <li>
                <span className="step-index">04</span>
                <div>
                  <h4>Verification and Closure</h4>
                  <p>Admin verifies proof, SLA status is finalized and citizen receives closure update.</p>
                </div>
              </li>
            </ol>
          </article>

          <article className="gov-content-card gov-service-card">
            <div className="gov-section-head">
              <h2>Service Charter Snapshot</h2>
              <p>Illustrative benchmarks for urban grievance redressal governance.</p>
            </div>
            <div className="gov-charter-grid">
              <div>
                <h4>Road and Footpath Hazards</h4>
                <p>Prioritized based on severity and public-safety impact.</p>
              </div>
              <div>
                <h4>Drainage and Water Issues</h4>
                <p>Monsoon-sensitive response with ward-level operational escalation.</p>
              </div>
              <div>
                <h4>Streetlight and Utility Faults</h4>
                <p>Night-safety critical incidents monitored through dedicated task buckets.</p>
              </div>
              <div>
                <h4>Citizen Follow-up</h4>
                <p>Track by grievance ID, receive updates and submit post-resolution feedback.</p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
};

export default Home;
