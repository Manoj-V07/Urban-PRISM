import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api, { API_ORIGIN } from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import useAuth from "../hooks/useAuth";

const buildImageUrl = (imagePath) => {
  if (!imagePath) return "";
  const normalized = String(imagePath).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const uploadsIndex = normalized.toLowerCase().lastIndexOf("/uploads/");
  const relative =
    uploadsIndex !== -1
      ? normalized.slice(uploadsIndex + 1)
      : normalized.replace(/^\/+/, "");
  return `${API_ORIGIN}/${relative}`;
};

const PublicTracker = () => {
  const { grievanceId: paramGrievanceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [grievanceId, setGrievanceId] = useState(paramGrievanceId || "");
  const [tracker, setTracker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const statusTone = useMemo(() => {
    const status = tracker?.grievance?.status;
    if (status === "Resolved") {
      return { bg: "#dcfce7", color: "#166534" };
    }
    if (status === "In Progress") {
      return { bg: "#fef3c7", color: "#92400e" };
    }
    return { bg: "#e5e7eb", color: "#374151" };
  }, [tracker?.grievance?.status]);

  const fetchTracker = async (idFromSubmit) => {
    const id = String(idFromSubmit ?? grievanceId).trim();
    if (!id) {
      setError("Please enter a grievance ID");
      return;
    }

    setLoading(true);
    setError("");
    setFeedbackMessage("");

    try {
      const { data } = await api.get(ENDPOINTS.PUBLIC.TRACK(id));
      setTracker(data);
      setRating(data.feedback?.rating || 0);
      setComment(data.feedback?.comment || "");
      if (paramGrievanceId !== id) {
        navigate(`/track/${encodeURIComponent(id)}`, { replace: true });
      }
    } catch (err) {
      setTracker(null);
      setError(err.response?.data?.message || "Could not fetch tracker details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchTracker();
  };

  const submitFeedback = async () => {
    if (!tracker?.grievance?.grievance_id) return;

    if (!user) {
      setFeedbackMessage("Please login to submit feedback.");
      return;
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setFeedbackMessage("Please select a rating from 1 to 5");
      return;
    }

    setSubmittingFeedback(true);
    setFeedbackMessage("");

    try {
      const { data } = await api.post(ENDPOINTS.PUBLIC.FEEDBACK, {
        grievanceId: tracker.grievance.grievance_id,
        rating,
        comment,
      });
      setFeedbackMessage(data.message || "Feedback submitted successfully");
      await fetchTracker(tracker.grievance.grievance_id);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setFeedbackMessage("Please login to submit feedback.");
      } else {
        setFeedbackMessage(err.response?.data?.message || "Failed to submit feedback");
      }
    } finally {
      setSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    if (paramGrievanceId) {
      fetchTracker(paramGrievanceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramGrievanceId]);

  return (
    <div className="public-tracker-page">
      <div className="public-tracker-card">
        <h2>Public Complaint Tracker</h2>
        <p className="public-tracker-muted">
          Enter your grievance ID to track status and submit feedback after resolution.
        </p>

        <form onSubmit={handleSubmit} className="public-tracker-search">
          <input
            value={grievanceId}
            onChange={(e) => setGrievanceId(e.target.value)}
            placeholder="Enter grievance ID (example: 123e4567...)"
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Searching..." : "Track"}
          </button>
        </form>

        {error && <div className="public-tracker-error">{error}</div>}

        {tracker?.grievance && (
          <div className="public-tracker-content">
            <div className="public-tracker-head">
              <div>
                <h3>{tracker.grievance.grievance_id}</h3>
                <p className="public-tracker-muted">
                  {tracker.grievance.category} | {tracker.grievance.district_name}, Ward {tracker.grievance.ward_id}
                </p>
              </div>
              <span
                className="public-status-pill"
                style={{ background: statusTone.bg, color: statusTone.color }}
              >
                {tracker.grievance.status}
              </span>
            </div>

            <div className="public-tracker-grid">
              <div>
                <strong>Summary:</strong>
                <p>{tracker.grievance.summary || tracker.grievance.complaint_text}</p>
                <strong>Severity:</strong>
                <p>{tracker.grievance.severity_level}</p>
              </div>

              {tracker.grievance.image_url && (
                <img
                  className="public-tracker-image"
                  src={buildImageUrl(tracker.grievance.image_url)}
                  alt="Complaint evidence"
                />
              )}
            </div>

            <div className="public-stepper">
              {tracker.timeline?.map((step) => (
                <div
                  key={step.key}
                  className={`public-step ${step.completed ? "done" : "todo"}`}
                >
                  <div className="public-step-dot" />
                  <div>
                    <p className="public-step-label">{step.label}</p>
                    <p className="public-step-date">
                      {step.date ? new Date(step.date).toLocaleString() : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="public-feedback-box">
              <h4>Post-Resolution Feedback</h4>
              {tracker.feedback?.canSubmit ? (
                user ? (
                  <>
                    <div className="public-stars">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`public-star ${rating >= n ? "active" : ""}`}
                          onClick={() => setRating(n)}
                          aria-label={`Rate ${n} star`}
                        >
                          ★
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience (optional)"
                      rows={3}
                      maxLength={500}
                    />

                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={submittingFeedback}
                      onClick={submitFeedback}
                    >
                      {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                    </button>
                  </>
                ) : (
                  <div className="public-feedback-login-note">
                    <p className="public-tracker-muted" style={{ margin: 0 }}>
                      Please login to submit rating and feedback for this resolved complaint.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        navigate(
                          `/login?redirect=${encodeURIComponent(
                            `${location.pathname}${location.search}`
                          )}`
                        )
                      }
                    >
                      Login to Submit Feedback
                    </button>
                  </div>
                )
              ) : tracker.feedback?.rating ? (
                <p className="public-tracker-muted">
                  Feedback received: {tracker.feedback.rating}/5
                  {tracker.feedback.comment ? ` - ${tracker.feedback.comment}` : ""}
                </p>
              ) : (
                <p className="public-tracker-muted">
                  Feedback can be submitted after the grievance is resolved.
                </p>
              )}

              {feedbackMessage && <p className="public-feedback-msg">{feedbackMessage}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicTracker;
