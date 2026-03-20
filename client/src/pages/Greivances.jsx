import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useFetch from "../hooks/useFetch";
import api, { API_ORIGIN } from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import {
  SEVERITY_COLORS,
  STATUS_COLORS,
  GRIEVANCE_STATUSES,
} from "../utils/constants";
import { formatDate, truncateText } from "../utils/formatters";
import GrievanceForm from "../components/forms/GrievanceForm";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import Toast from "../components/common/Toast";

const dedupeGrievances = (items = []) => {
  const seen = new Set();
  const output = [];

  for (const grievance of items) {
    if (!grievance) continue;
    const id = String(grievance._id || grievance.grievance_id || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    output.push(grievance);
  }

  return output;
};

const buildGrievanceImageUrl = (imagePath) => {
  if (!imagePath) return "";

  const normalized = String(imagePath).replace(/\\/g, "/");

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  const uploadsIndex = normalized.toLowerCase().lastIndexOf("/uploads/");
  const relative = uploadsIndex !== -1
    ? normalized.slice(uploadsIndex + 1)
    : normalized.replace(/^\/+/, "");

  return `${API_ORIGIN}/${relative}`;
};

const Grievances = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "Admin";
  const { data: grievances, loading, refetch } = useFetch(
    ENDPOINTS.GRIEVANCES.MY
  );
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState(null);
  const [newSubmission, setNewSubmission] = useState(null);
  const grievanceList = dedupeGrievances(grievances || []);

  const handleFormSuccess = (createdGrievance) => {
    setShowForm(false);
    setToast({ message: "Complaint submitted successfully!", type: "success" });
    setNewSubmission(createdGrievance || null);
    refetch();
  };

  const handleStatusUpdate = async (id) => {
    try {
      await api.patch(ENDPOINTS.GRIEVANCES.UPDATE_STATUS(id), {
        status: statusUpdate,
      });
      setToast({ message: "Status updated", type: "success" });
      setSelectedGrievance(null);
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Update failed",
        type: "error",
      });
    }
  };

  const handleTranslate = async (text) => {
    setTranslating(true);
    try {
      const { data } = await api.post(ENDPOINTS.AI.TRANSLATE, { text });
      setTranslatedText(data.translated);
    } catch {
      setToast({ message: "Translation failed", type: "error" });
    } finally {
      setTranslating(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="grievances-page">
      <div className="page-header">
        <div>
          <h2>{isAdmin ? "All Grievances" : "My Complaints"}</h2>
          <p className="text-muted">
            {grievanceList.length || 0} total complaints
          </p>
        </div>
        {!isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            + File Complaint
          </button>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Grievance Cards */}
      <div className="grievance-list">
        {!grievanceList || grievanceList.length === 0 ? (
          <div className="empty-state">
            <p>No complaints found.</p>
            {!isAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                File your first complaint
              </button>
            )}
          </div>
        ) : (
          grievanceList.map((g) => (
            <div
              key={`${g._id}-${g.grievance_id || "row"}`}
              className="grievance-card"
              onClick={() => {
                setSelectedGrievance(g);
                setStatusUpdate(g.status);
              }}
            >
              <div className="grievance-card-header">
                <span className="grievance-category">{g.category}</span>
                <span
                  className="severity-badge"
                  style={{
                    backgroundColor: SEVERITY_COLORS[g.severity_level],
                  }}
                >
                  {g.severity_level}
                </span>
              </div>
              <p style={{ margin: "0.25rem 0", fontSize: "0.85rem", color: "#6b7280" }}>
                ID: <strong>{g.grievance_id || "N/A"}</strong>
              </p>
              <p className="grievance-text">
                {truncateText(g.complaint_text, 120)}
              </p>
              {g.summary && (
                <p className="grievance-summary">
                  <span className="ai-tag">🤖 AI</span> {g.summary}
                </p>
              )}
              <div className="grievance-card-footer">
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: STATUS_COLORS[g.status],
                  }}
                >
                  {g.status}
                </span>
                <span className="grievance-date">
                  {formatDate(g.complaint_date)}
                </span>
                <span className="grievance-ward">
                  Ward: {g.ward_id}
                </span>
              </div>
              {!isAdmin && (
                <div style={{ marginTop: "0.7rem", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/track/${encodeURIComponent(g.grievance_id || "")}`);
                    }}
                    disabled={!g.grievance_id}
                  >
                    Track Complaint
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Complaint Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="File a Complaint"
        size="lg"
      >
        <GrievanceForm
          onSuccess={handleFormSuccess}
          onError={(msg) =>
            setToast({ message: msg, type: "error" })
          }
        />
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedGrievance}
        onClose={() => {
          setSelectedGrievance(null);
          setTranslatedText(null);
        }}
        title="Complaint Details"
        size="lg"
      >
        {selectedGrievance && (
          <div className="grievance-detail">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Grievance ID</span>
                <span className="detail-value">
                  {selectedGrievance.grievance_id || "N/A"}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Category</span>
                <span className="detail-value">
                  {selectedGrievance.category}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Severity</span>
                <span
                  className="detail-value"
                  style={{
                    color:
                      SEVERITY_COLORS[selectedGrievance.severity_level],
                  }}
                >
                  {selectedGrievance.severity_level}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor:
                      STATUS_COLORS[selectedGrievance.status],
                  }}
                >
                  {selectedGrievance.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span className="detail-value">
                  {formatDate(selectedGrievance.complaint_date)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">District</span>
                <span className="detail-value">
                  {selectedGrievance.district_name}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ward</span>
                <span className="detail-value">
                  {selectedGrievance.ward_id}
                </span>
              </div>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Complaint</span>
              <p className="detail-value">
                {selectedGrievance.complaint_text}
              </p>
              <button
                className="btn btn-outline btn-sm translate-btn"
                onClick={() => handleTranslate(selectedGrievance.complaint_text)}
                disabled={translating}
              >
                {translating ? "Translating..." : "🌐 Translate to English"}
              </button>
              {translatedText && (
                <div className="translated-box">
                  <span className="detail-label">Translation</span>
                  <p className="detail-value">{translatedText}</p>
                </div>
              )}
            </div>
            {selectedGrievance.summary && (
              <div className="detail-item full-width ai-summary-box">
                <span className="detail-label">🤖 AI Summary</span>
                <p className="detail-value">{selectedGrievance.summary}</p>
              </div>
            )}
            {selectedGrievance.image_url && (
              <div className="detail-item full-width">
                <span className="detail-label">Image</span>
                <img
                  src={buildGrievanceImageUrl(selectedGrievance.image_url)}
                  alt="Grievance"
                  className="grievance-image"
                  onError={(e) => {
                    console.error('Image load error:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
            {isAdmin && (
              <div className="status-update-section">
                <h4>Update Status</h4>
                <div className="status-update-row">
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                  >
                    {GRIEVANCE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      handleStatusUpdate(selectedGrievance._id)
                    }
                  >
                    Update
                  </button>
                </div>
              </div>
            )}
            {!isAdmin && selectedGrievance?.grievance_id && (
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate(`/track/${encodeURIComponent(selectedGrievance.grievance_id)}`)}
                >
                  Track This Complaint
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={!!newSubmission}
        onClose={() => setNewSubmission(null)}
        title="Complaint Registered"
      >
        {newSubmission && (
          <div style={{ display: "grid", gap: "0.9rem" }}>
            <p style={{ margin: 0 }}>Your complaint has been created successfully.</p>
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                background: "#f9fafb",
              }}
            >
              <strong>Grievance ID: {newSubmission.grievance_id || "N/A"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button className="btn btn-outline" onClick={() => setNewSubmission(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const id = newSubmission.grievance_id;
                  setNewSubmission(null);
                  if (id) navigate(`/track/${encodeURIComponent(id)}`);
                }}
                disabled={!newSubmission.grievance_id}
              >
                Track Now
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Grievances;
