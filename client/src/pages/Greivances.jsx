import { useState } from "react";
import useAuth from "../hooks/useAuth";
import useFetch from "../hooks/useFetch";
import api from "../api/axios";
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

const Grievances = () => {
  const { user } = useAuth();
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

  const handleFormSuccess = () => {
    setShowForm(false);
    setToast({
      message: "Complaint submitted successfully!",
      type: "success",
    });
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
            {grievances?.length || 0} total complaints
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
        {!grievances || grievances.length === 0 ? (
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
          grievances.map((g) => (
            <div
              key={g._id}
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
                  src={`http://localhost:5000/${selectedGrievance.image_url}`}
                  alt="Grievance"
                  className="grievance-image"
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Grievances;
