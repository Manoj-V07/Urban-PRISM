import { useState, useEffect } from "react";
import useFetch from "../hooks/useFetch";
import api from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import { TASK_STATUS_COLORS } from "../utils/constants";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import Toast from "../components/common/Toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const buildImageUrl = (imagePath) => {
  if (!imagePath) return "";
  const normalized = String(imagePath).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const uploadsIndex = normalized.toLowerCase().lastIndexOf("/uploads/");
  const relative =
    uploadsIndex !== -1
      ? normalized.slice(uploadsIndex + 1)
      : normalized.replace(/^\/+/, "");
  return `${API_BASE_URL}/${relative}`;
};

const TaskAssignments = () => {
  const { data: assignments, loading, refetch } = useFetch(ENDPOINTS.TASKS.LIST);
  const { data: highGrievances } = useFetch(
    `${ENDPOINTS.GRIEVANCES.MY}?severity=High`
  );
  const [toast, setToast] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [eligibleWorkers, setEligibleWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchEligibleWorkers = async (grievance) => {
    setLoadingWorkers(true);
    try {
      const params = new URLSearchParams();
      if (grievance.category) params.set("category", grievance.category);
      if (grievance.location?.coordinates) {
        params.set("longitude", grievance.location.coordinates[0]);
        params.set("latitude", grievance.location.coordinates[1]);
      }
      const { data } = await api.get(
        `${ENDPOINTS.FIELD_WORKERS.ELIGIBLE}?${params.toString()}`
      );
      setEligibleWorkers(data);
    } catch {
      setEligibleWorkers([]);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const openAssignModal = (grievance) => {
    setSelectedGrievance(grievance);
    setShowAssignModal(true);
    fetchEligibleWorkers(grievance);
  };

  const handleAssign = async (workerId) => {
    try {
      await api.post(ENDPOINTS.TASKS.ASSIGN, {
        grievanceId: selectedGrievance._id,
        workerId,
      });
      setToast({ message: "Task assigned successfully", type: "success" });
      setShowAssignModal(false);
      setSelectedGrievance(null);
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Assignment failed",
        type: "error",
      });
    }
  };

  const handleVerifyTask = async (taskId) => {
    try {
      await api.patch(ENDPOINTS.TASKS.VERIFY(taskId));
      setToast({ message: "Task verified & grievance resolved", type: "success" });
      setSelectedTask(null);
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Verification failed",
        type: "error",
      });
    }
  };

  const handleRejectTask = async (taskId) => {
    try {
      await api.patch(ENDPOINTS.TASKS.REJECT(taskId), {
        reason: rejectReason,
      });
      setToast({ message: "Task rejected, worker must redo", type: "success" });
      setSelectedTask(null);
      setRejectReason("");
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Rejection failed",
        type: "error",
      });
    }
  };

  if (loading) return <Loader />;

  // Unassigned high-priority grievances
  const assignedGrievanceIds = new Set(
    (assignments || []).map((a) =>
      typeof a.grievance === "object" ? a.grievance._id : a.grievance
    )
  );
  const unassignedGrievances = (highGrievances || []).filter(
    (g) =>
      g.severity_level === "High" &&
      g.status !== "Resolved" &&
      !assignedGrievanceIds.has(g._id)
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Task Assignments</h2>
        <p className="text-muted">Assign and manage field maintenance tasks</p>
      </div>

      {/* Unassigned High-Priority Grievances */}
      {unassignedGrievances.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>
            Unassigned High-Priority Grievances ({unassignedGrievances.length})
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {unassignedGrievances.map((g) => (
                  <tr key={g._id}>
                    <td>{g.grievance_id}</td>
                    <td>{g.category}</td>
                    <td>
                      {g.district_name}, Ward {g.ward_id}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: "#fef3c7",
                          color: "#92400e",
                        }}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td>{new Date(g.complaint_date).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openAssignModal(g)}
                      >
                        Assign Worker
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Assignments */}
      <h3 style={{ marginBottom: "1rem" }}>
        All Assignments ({(assignments || []).length})
      </h3>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Grievance</th>
              <th>Category</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(assignments || []).length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "2rem" }}>
                  No assignments yet
                </td>
              </tr>
            ) : (
              (assignments || []).map((a) => (
                <tr key={a._id}>
                  <td>{a.grievance?.grievance_id || "—"}</td>
                  <td>{a.grievance?.category || "—"}</td>
                  <td>
                    {a.assignedTo?.name || "—"}
                    <br />
                    <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      {a.assignedTo?.workerCategory}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background:
                          TASK_STATUS_COLORS[a.status] + "22" || "#e5e7eb",
                        color: TASK_STATUS_COLORS[a.status] || "#374151",
                      }}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td>
                    {a.status === "Completed" && (
                      <button
                        className="btn btn-sm"
                        style={{ background: "#8b5cf6", color: "#fff" }}
                        onClick={() => setSelectedTask(a)}
                      >
                        Review Proof
                      </button>
                    )}
                    {a.status === "Verified" && (
                      <span style={{ color: "#22c55e", fontWeight: 600 }}>
                        ✓ Done
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Worker Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedGrievance(null);
        }}
        title="Assign Field Worker"
        size="lg"
      >
        {selectedGrievance && (
          <div>
            <div
              style={{
                background: "#f9fafb",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <h4>Grievance Details</h4>
              <p>
                <strong>ID:</strong> {selectedGrievance.grievance_id}
              </p>
              <p>
                <strong>Category:</strong> {selectedGrievance.category}
              </p>
              <p>
                <strong>Severity:</strong> {selectedGrievance.severity_level}
              </p>
              <p>
                <strong>Location:</strong> {selectedGrievance.district_name},
                Ward {selectedGrievance.ward_id}
              </p>
              <p>
                <strong>Complaint:</strong> {selectedGrievance.complaint_text}
              </p>
            </div>
            <h4 style={{ marginBottom: "0.75rem" }}>Eligible Workers</h4>
            {loadingWorkers ? (
              <Loader />
            ) : eligibleWorkers.length === 0 ? (
              <p style={{ color: "#6b7280" }}>
                No eligible verified workers found for this category.
              </p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Active Tasks</th>
                      <th>Distance</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eligibleWorkers.map((w) => (
                      <tr key={w._id}>
                        <td>{w.name}</td>
                        <td>{w.workerCategory}</td>
                        <td>{w.activeTaskCount || 0}</td>
                        <td>
                          {w.distance != null
                            ? `${(w.distance / 1000).toFixed(1)} km`
                            : "—"}
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleAssign(w._id)}
                          >
                            Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Review Proof Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => {
          setSelectedTask(null);
          setRejectReason("");
        }}
        title="Review Proof of Completion"
        size="lg"
      >
        {selectedTask && (
          <div>
            <div
              style={{
                background: "#f9fafb",
                borderRadius: "8px",
                padding: "1rem",
                marginBottom: "1rem",
              }}
            >
              <p>
                <strong>Grievance:</strong>{" "}
                {selectedTask.grievance?.grievance_id}
              </p>
              <p>
                <strong>Category:</strong> {selectedTask.grievance?.category}
              </p>
              <p>
                <strong>Worker:</strong> {selectedTask.assignedTo?.name} (
                {selectedTask.assignedTo?.workerCategory})
              </p>
              <p>
                <strong>Completed:</strong>{" "}
                {selectedTask.completedAt &&
                  new Date(selectedTask.completedAt).toLocaleString()}
              </p>
              {selectedTask.completionNotes && (
                <p>
                  <strong>Notes:</strong> {selectedTask.completionNotes}
                </p>
              )}
            </div>

            {selectedTask.proofImageUrl && (
              <div style={{ marginBottom: "1rem" }}>
                <h4>Proof Image</h4>
                <img
                  src={buildImageUrl(selectedTask.proofImageUrl)}
                  alt="Proof of completion"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "400px",
                    borderRadius: "8px",
                    border: "1px solid #d1d5db",
                  }}
                />
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexDirection: "column",
              }}
            >
              <button
                className="btn btn-primary"
                style={{ background: "#22c55e" }}
                onClick={() => handleVerifyTask(selectedTask._id)}
              >
                ✓ Verify & Resolve Grievance
              </button>
              <div>
                <label style={{ display: "block", marginBottom: "0.25rem" }}>
                  Rejection Reason (optional):
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Photo is unclear, work incomplete"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    marginBottom: "0.5rem",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                />
                <button
                  className="btn"
                  style={{ background: "#ef4444", color: "#fff" }}
                  onClick={() => handleRejectTask(selectedTask._id)}
                >
                  ✕ Reject & Request Rework
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default TaskAssignments;
