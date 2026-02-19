import { useState } from "react";
import useFetch from "../hooks/useFetch";
import api from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import { TASK_STATUS_COLORS, SEVERITY_COLORS } from "../utils/constants";
import { formatDate, formatDateTime, truncateText } from "../utils/formatters";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import Toast from "../components/common/Toast";

const MyTasks = () => {
  const { data: tasks, loading, refetch } = useFetch(ENDPOINTS.TASKS.MY);
  const [toast, setToast] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [workerNotes, setWorkerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const handleStartTask = async (taskId) => {
    try {
      await api.patch(ENDPOINTS.TASKS.START(taskId));
      setToast({ message: "Task started!", type: "success" });
      refetch();
      // Refresh selected task
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask({ ...selectedTask, status: "In Progress" });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to start task",
        type: "error",
      });
    }
  };

  const handleSubmitProof = async (taskId) => {
    if (!proofImage) {
      setToast({ message: "Please select a proof image", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("proofImage", proofImage);
      if (workerNotes) formData.append("workerNotes", workerNotes);

      await api.patch(ENDPOINTS.TASKS.SUBMIT_PROOF(taskId), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({ message: "Proof submitted for review!", type: "success" });
      setSelectedTask(null);
      setProofImage(null);
      setWorkerNotes("");
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Proof submission failed",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = tasks?.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status === statusFilter;
  });

  const stats = {
    assigned: tasks?.filter((t) => t.status === "Assigned").length || 0,
    inProgress: tasks?.filter((t) => t.status === "In Progress").length || 0,
    submitted: tasks?.filter((t) => t.status === "Proof Submitted").length || 0,
    approved: tasks?.filter((t) => t.status === "Approved").length || 0,
    rejected: tasks?.filter((t) => t.status === "Rejected").length || 0,
  };

  if (loading) return <Loader />;

  return (
    <div className="my-tasks-page">
      <div className="page-header">
        <div>
          <h2>My Tasks</h2>
          <p className="text-muted">{tasks?.length || 0} total tasks</p>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Stats summary */}
      <div className="stats-row" style={{ marginBottom: "1rem" }}>
        <div className="stat-card" style={{ borderLeft: "4px solid #6366f1" }}>
          <span className="stat-number">{stats.assigned}</span>
          <span className="stat-label">Assigned</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #3b82f6" }}>
          <span className="stat-number">{stats.inProgress}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <span className="stat-number">{stats.submitted}</span>
          <span className="stat-label">Submitted</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #22c55e" }}>
          <span className="stat-number">{stats.approved}</span>
          <span className="stat-label">Approved</span>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #ef4444" }}>
          <span className="stat-number">{stats.rejected}</span>
          <span className="stat-label">Rejected</span>
        </div>
      </div>

      {/* Filter */}
      <div className="filter-tabs" style={{ marginBottom: "1rem" }}>
        {["all", "Assigned", "In Progress", "Proof Submitted", "Approved", "Rejected"].map(
          (s) => (
            <button
              key={s}
              className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline"}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "All" : s}
            </button>
          )
        )}
      </div>

      {/* Task Cards */}
      <div className="task-list">
        {!filtered || filtered.length === 0 ? (
          <div className="empty-state">
            <p>No tasks found.</p>
          </div>
        ) : (
          filtered.map((t) => (
            <div
              key={t._id}
              className="task-card"
              onClick={() => {
                setSelectedTask(t);
                setProofImage(null);
                setWorkerNotes("");
              }}
            >
              <div className="task-card-header">
                <span
                  className="status-badge"
                  style={{ backgroundColor: TASK_STATUS_COLORS[t.status] }}
                >
                  {t.status}
                </span>
                <span
                  className="severity-badge"
                  style={{ backgroundColor: SEVERITY_COLORS[t.priority] }}
                >
                  {t.priority}
                </span>
              </div>
              <div className="task-card-body">
                <p className="task-category">
                  {t.grievance?.category || "N/A"}
                </p>
                <p className="task-text">
                  {truncateText(t.grievance?.complaint_text, 100)}
                </p>
                <p className="task-location">
                  📍 {t.grievance?.district_name}, Ward {t.grievance?.ward_id}
                </p>
              </div>
              <div className="task-card-footer">
                <span className="task-date">{formatDate(t.createdAt)}</span>
                {t.status === "Assigned" && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTask(t._id);
                    }}
                  >
                    Start Work
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => {
          setSelectedTask(null);
          setProofImage(null);
          setWorkerNotes("");
        }}
        title="Task Details"
        size="lg"
      >
        {selectedTask && (
          <div className="task-detail">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Status</span>
                <span
                  className="status-badge"
                  style={{ backgroundColor: TASK_STATUS_COLORS[selectedTask.status] }}
                >
                  {selectedTask.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Priority</span>
                <span
                  className="severity-badge"
                  style={{ backgroundColor: SEVERITY_COLORS[selectedTask.priority] }}
                >
                  {selectedTask.priority}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Category</span>
                <span className="detail-value">{selectedTask.grievance?.category}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span className="detail-value">
                  {selectedTask.grievance?.district_name}, Ward{" "}
                  {selectedTask.grievance?.ward_id}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Assigned By</span>
                <span className="detail-value">{selectedTask.assignedBy?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Assigned On</span>
                <span className="detail-value">{formatDateTime(selectedTask.createdAt)}</span>
              </div>
            </div>

            <div className="detail-item full-width">
              <span className="detail-label">Complaint Description</span>
              <p className="detail-value">{selectedTask.grievance?.complaint_text}</p>
            </div>

            {selectedTask.notes && (
              <div className="detail-item full-width">
                <span className="detail-label">Admin Instructions</span>
                <p className="detail-value">{selectedTask.notes}</p>
              </div>
            )}

            {/* Grievance image  */}
            {selectedTask.grievance?.image_url && (
              <div className="detail-item full-width">
                <span className="detail-label">Grievance Image</span>
                <img
                  src={`http://localhost:5000/${selectedTask.grievance.image_url}`}
                  alt="Grievance"
                  className="grievance-image"
                />
              </div>
            )}

            {/* Show proof if already submitted */}
            {selectedTask.proofImageUrl && (
              <div className="detail-item full-width">
                <span className="detail-label">Submitted Proof</span>
                <img
                  src={`http://localhost:5000/${selectedTask.proofImageUrl}`}
                  alt="Proof"
                  className="grievance-image"
                />
              </div>
            )}

            {/* Admin review notes */}
            {selectedTask.adminReviewNotes && (
              <div className="detail-item full-width">
                <span className="detail-label">Admin Review</span>
                <p className="detail-value" style={{ color: selectedTask.status === "Rejected" ? "#ef4444" : "#22c55e" }}>
                  {selectedTask.adminReviewNotes}
                </p>
              </div>
            )}

            {/* Action: Start task */}
            {selectedTask.status === "Assigned" && (
              <div className="form-actions" style={{ marginTop: "1rem" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleStartTask(selectedTask._id)}
                >
                  Start Work
                </button>
              </div>
            )}

            {/* Action: Submit proof (available for In Progress and Rejected) */}
            {["In Progress", "Assigned", "Rejected"].includes(selectedTask.status) && (
              <div className="proof-upload-section" style={{ marginTop: "1.5rem" }}>
                <h4>Upload Proof of Completion</h4>
                <div className="form-group">
                  <label>Proof Image *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofImage(e.target.files[0])}
                  />
                  {proofImage && (
                    <p className="text-muted" style={{ marginTop: "0.25rem" }}>
                      Selected: {proofImage.name}
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label>Notes (optional)</label>
                  <textarea
                    value={workerNotes}
                    onChange={(e) => setWorkerNotes(e.target.value)}
                    rows={2}
                    placeholder="Describe the work completed..."
                  />
                </div>
                <button
                  className="btn btn-primary"
                  disabled={submitting || !proofImage}
                  onClick={() => handleSubmitProof(selectedTask._id)}
                >
                  {submitting ? "Submitting..." : "Submit Proof"}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyTasks;
