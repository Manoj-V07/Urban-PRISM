import { useState } from "react";
import useFetch from "../hooks/useFetch";
import api, { API_ORIGIN } from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import { TASK_STATUS_COLORS } from "../utils/constants";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import Toast from "../components/common/Toast";

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

const MyTasks = () => {
  const { data: tasks, loading, refetch } = useFetch(ENDPOINTS.TASKS.MY);
  const [toast, setToast] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleStart = async (taskId) => {
    try {
      await api.patch(ENDPOINTS.TASKS.START(taskId));
      setToast({ message: "Task started", type: "success" });
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to start task",
        type: "error",
      });
    }
  };

  const handleComplete = async (taskId) => {
    if (!proofFile) {
      setToast({ message: "Please upload a proof image", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("proofImage", proofFile);
      if (notes) formData.append("notes", notes);

      await api.patch(ENDPOINTS.TASKS.COMPLETE(taskId), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({ message: "Task completed! Waiting for verification.", type: "success" });
      setSelectedTask(null);
      setProofFile(null);
      setNotes("");
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Submission failed",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  const activeTasks = (tasks || []).filter((t) =>
    ["Assigned", "In Progress"].includes(t.status)
  );
  const completedTasks = (tasks || []).filter((t) =>
    ["Completed", "Verified", "Rejected"].includes(t.status)
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>My Tasks</h2>
        <p className="text-muted">View and manage your assigned maintenance tasks</p>
      </div>

      {/* Active Tasks */}
      <h3 style={{ marginBottom: "1rem" }}>
        Active Tasks ({activeTasks.length})
      </h3>
      {activeTasks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            background: "#f9fafb",
            borderRadius: "8px",
            marginBottom: "2rem",
          }}
        >
          <p style={{ color: "#6b7280" }}>No active tasks assigned</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {activeTasks.map((task) => (
            <div
              key={task._id}
              className="card"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                padding: "1.25rem",
                borderLeft: `4px solid ${TASK_STATUS_COLORS[task.status] || "#6b7280"}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.75rem",
                }}
              >
                <h4 style={{ margin: 0 }}>
                  {task.grievance?.category || "Task"}
                </h4>
                <span
                  className="badge"
                  style={{
                    background: TASK_STATUS_COLORS[task.status] + "22",
                    color: TASK_STATUS_COLORS[task.status],
                  }}
                >
                  {task.status}
                </span>
              </div>

              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                <strong>Grievance:</strong>{" "}
                {task.grievance?.grievance_id || "\u2014"}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                <strong>Location:</strong>{" "}
                {task.grievance?.district_name}, Ward{" "}
                {task.grievance?.ward_id}
              </p>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>
                <strong>Severity:</strong>{" "}
                {task.grievance?.severity_level}
              </p>
              <p
                style={{
                  margin: "0.5rem 0",
                  fontSize: "0.85rem",
                  color: "#6b7280",
                }}
              >
                {task.grievance?.complaint_text}
              </p>

              {task.grievance?.image_url && (
                <img
                  src={buildImageUrl(task.grievance.image_url)}
                  alt="Grievance"
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginBottom: "0.75rem",
                  }}
                />
              )}

              {task.rejectionReason && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "6px",
                    padding: "0.5rem",
                    marginBottom: "0.75rem",
                    fontSize: "0.85rem",
                    color: "#991b1b",
                  }}
                >
                  <strong>Rejected:</strong> {task.rejectionReason}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                {task.status === "Assigned" && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleStart(task._id)}
                  >
                    Start Task
                  </button>
                )}
                {["Assigned", "In Progress"].includes(task.status) && (
                  <button
                    className="btn btn-sm"
                    style={{ background: "#8b5cf6", color: "#fff" }}
                    onClick={() => setSelectedTask(task)}
                  >
                    Upload Proof & Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Tasks */}
      <h3 style={{ marginBottom: "1rem" }}>
        History ({completedTasks.length})
      </h3>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Grievance</th>
              <th>Category</th>
              <th>Status</th>
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {completedTasks.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>
                  No completed tasks yet
                </td>
              </tr>
            ) : (
              completedTasks.map((task) => (
                <tr key={task._id}>
                  <td>{task.grievance?.grievance_id || "\u2014"}</td>
                  <td>{task.grievance?.category || "\u2014"}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: TASK_STATUS_COLORS[task.status] + "22",
                        color: TASK_STATUS_COLORS[task.status],
                      }}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td>
                    {task.completedAt
                      ? new Date(task.completedAt).toLocaleString()
                      : "\u2014"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Complete Task Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => {
          setSelectedTask(null);
          setProofFile(null);
          setNotes("");
        }}
        title="Complete Task"
      >
        {selectedTask && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                background: "#f9fafb",
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              <p>
                <strong>Grievance:</strong>{" "}
                {selectedTask.grievance?.grievance_id}
              </p>
              <p>
                <strong>Category:</strong>{" "}
                {selectedTask.grievance?.category}
              </p>
            </div>

            <div className="form-group">
              <label>
                <strong>Proof Image *</strong>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files[0])}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  width: "100%",
                }}
              />
              {proofFile && (
                <img
                  src={URL.createObjectURL(proofFile)}
                  alt="Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    marginTop: "0.5rem",
                    borderRadius: "8px",
                  }}
                />
              )}
            </div>

            <div className="form-group">
              <label>
                <strong>Completion Notes</strong>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe the work done..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  resize: "vertical",
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={() => handleComplete(selectedTask._id)}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Proof & Complete"}
            </button>
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

export default MyTasks;