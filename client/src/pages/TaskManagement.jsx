import { useState } from "react";
import useFetch from "../hooks/useFetch";
import api, { API_ORIGIN } from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import { TASK_STATUS_COLORS, SEVERITY_COLORS } from "../utils/constants";
import { formatDate, formatDateTime, truncateText } from "../utils/formatters";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import Toast from "../components/common/Toast";

const TaskManagement = () => {
  const { data: tasks, loading, refetch } = useFetch(ENDPOINTS.TASKS.LIST);
  const { data: workers } = useFetch(ENDPOINTS.TASKS.VERIFIED_WORKERS);
  const { data: grievances } = useFetch(ENDPOINTS.GRIEVANCES.MY);
  const [toast, setToast] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // Assignment form
  const [assignForm, setAssignForm] = useState({
    grievanceId: "",
    workerId: "",
    priority: "Medium",
    notes: "",
  });

  const highPriorityGrievances = grievances?.filter(
    (g) => g.status !== "Resolved"
  );

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post(ENDPOINTS.TASKS.ASSIGN, assignForm);
      setToast({ message: "Task assigned successfully", type: "success" });
      setShowAssignModal(false);
      setAssignForm({ grievanceId: "", workerId: "", priority: "Medium", notes: "" });
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Assignment failed",
        type: "error",
      });
    }
  };

  const handleApprove = async (taskId) => {
    try {
      await api.patch(ENDPOINTS.TASKS.APPROVE(taskId), { reviewNotes });
      setToast({ message: "Task approved — grievance resolved!", type: "success" });
      setSelectedTask(null);
      setReviewNotes("");
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Approval failed",
        type: "error",
      });
    }
  };

  const handleReject = async (taskId) => {
    try {
      await api.patch(ENDPOINTS.TASKS.REJECT(taskId), { reviewNotes });
      setToast({ message: "Task rejected — worker notified", type: "success" });
      setSelectedTask(null);
      setReviewNotes("");
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Rejection failed",
        type: "error",
      });
    }
  };

  const filtered = tasks?.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status === statusFilter;
  });

  if (loading) return <Loader />;

  return (
    <div className="task-management-page">
      <div className="page-header">
        <div>
          <h2>Task Management</h2>
          <p className="text-muted">{tasks?.length || 0} total tasks</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowAssignModal(true)}
        >
          + Assign Task
        </button>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Status filter tabs */}
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
                setReviewNotes("");
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
              </div>
              <div className="task-card-footer">
                <span className="task-worker">
                  👷 {t.assignedTo?.name || "Unknown"}
                </span>
                <span className="task-date">{formatDate(t.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assign Task Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Task to Field Worker"
        size="lg"
      >
        <form onSubmit={handleAssign} className="assign-task-form">
          <div className="form-group">
            <label>Select Grievance</label>
            <select
              value={assignForm.grievanceId}
              onChange={(e) =>
                setAssignForm({ ...assignForm, grievanceId: e.target.value })
              }
              required
            >
              <option value="">-- Select a grievance --</option>
              {highPriorityGrievances?.map((g) => (
                <option key={g._id} value={g._id}>
                  [{g.severity_level}] {g.category} — {truncateText(g.complaint_text, 50)} (Ward: {g.ward_id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Assign to Worker</label>
            <select
              value={assignForm.workerId}
              onChange={(e) =>
                setAssignForm({ ...assignForm, workerId: e.target.value })
              }
              required
            >
              <option value="">-- Select a verified worker --</option>
              {workers?.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} — {w.assignedDistrict || "No district"} (Load: {w.currentWorkload})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select
              value={assignForm.priority}
              onChange={(e) =>
                setAssignForm({ ...assignForm, priority: e.target.value })
              }
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes for Worker (optional)</label>
            <textarea
              value={assignForm.notes}
              onChange={(e) =>
                setAssignForm({ ...assignForm, notes: e.target.value })
              }
              rows={3}
              placeholder="Special instructions for the field worker..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Assign Task
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowAssignModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Detail / Review Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
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
                <span className="detail-label">Worker</span>
                <span className="detail-value">
                  {selectedTask.assignedTo?.name} ({selectedTask.assignedTo?.email})
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Assigned</span>
                <span className="detail-value">
                  {formatDateTime(selectedTask.createdAt)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Category</span>
                <span className="detail-value">
                  {selectedTask.grievance?.category}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span className="detail-value">
                  {selectedTask.grievance?.district_name}, Ward{" "}
                  {selectedTask.grievance?.ward_id}
                </span>
              </div>
            </div>

            <div className="detail-item full-width">
              <span className="detail-label">Complaint</span>
              <p className="detail-value">
                {selectedTask.grievance?.complaint_text}
              </p>
            </div>

            {selectedTask.notes && (
              <div className="detail-item full-width">
                <span className="detail-label">Admin Notes</span>
                <p className="detail-value">{selectedTask.notes}</p>
              </div>
            )}

            {selectedTask.workerNotes && (
              <div className="detail-item full-width">
                <span className="detail-label">Worker Notes</span>
                <p className="detail-value">{selectedTask.workerNotes}</p>
              </div>
            )}

            {/* Grievance image */}
            {selectedTask.grievance?.image_url && (
              <div className="detail-item full-width">
                <span className="detail-label">Grievance Image</span>
                <img
                  src={`${API_ORIGIN}/${selectedTask.grievance.image_url}`}
                  alt="Grievance"
                  className="grievance-image"
                />
              </div>
            )}

            {/* Proof image */}
            {selectedTask.proofImageUrl && (
              <div className="detail-item full-width">
                <span className="detail-label">Proof Image</span>
                <img
                  src={`${API_ORIGIN}/${selectedTask.proofImageUrl}`}
                  alt="Proof of completion"
                  className="grievance-image"
                />
              </div>
            )}

            {selectedTask.adminReviewNotes && (
              <div className="detail-item full-width">
                <span className="detail-label">Review Notes</span>
                <p className="detail-value">{selectedTask.adminReviewNotes}</p>
              </div>
            )}

            {/* Approve / Reject controls */}
            {selectedTask.status === "Proof Submitted" && (
              <div className="review-section">
                <h4>Review Proof Submission</h4>
                <div className="form-group">
                  <label>Review Notes (optional)</label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={2}
                    placeholder="Comments about the submission..."
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => handleApprove(selectedTask._id)}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleReject(selectedTask._id)}
                  >
                    ✗ Reject
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

export default TaskManagement;
