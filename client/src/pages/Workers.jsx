import { useState } from "react";
import useFetch from "../hooks/useFetch";
import api from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import { formatDate } from "../utils/formatters";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import Toast from "../components/common/Toast";

const Workers = () => {
  const { data: workers, loading, refetch } = useFetch(ENDPOINTS.TASKS.WORKERS);
  const [toast, setToast] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [assignedDistrict, setAssignedDistrict] = useState("");
  const [filter, setFilter] = useState("all"); // all | verified | pending

  const handleVerify = async (workerId) => {
    try {
      await api.patch(ENDPOINTS.TASKS.VERIFY_WORKER(workerId), {
        assignedDistrict: assignedDistrict || undefined,
      });
      setToast({ message: "Worker verified successfully", type: "success" });
      setSelectedWorker(null);
      setAssignedDistrict("");
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Verification failed",
        type: "error",
      });
    }
  };

  const handleRevoke = async (workerId) => {
    try {
      await api.patch(ENDPOINTS.TASKS.REVOKE_WORKER(workerId));
      setToast({ message: "Worker verification revoked", type: "success" });
      refetch();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Revoke failed",
        type: "error",
      });
    }
  };

  const filtered = workers?.filter((w) => {
    if (filter === "verified") return w.isVerified;
    if (filter === "pending") return !w.isVerified;
    return true;
  });

  if (loading) return <Loader />;

  return (
    <div className="workers-page">
      <div className="page-header">
        <div>
          <h2>Field Worker Management</h2>
          <p className="text-muted">
            {workers?.length || 0} total workers &middot;{" "}
            {workers?.filter((w) => w.isVerified).length || 0} verified
          </p>
        </div>
        <div className="filter-tabs">
          {["all", "verified", "pending"].map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-outline"}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="workers-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>District</th>
              <th>Workload</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!filtered || filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
                  No workers found.
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <tr key={w._id}>
                  <td>{w.name}</td>
                  <td>{w.email}</td>
                  <td>{w.phone || "—"}</td>
                  <td>{w.assignedDistrict || "—"}</td>
                  <td>
                    <span className="workload-badge">{w.currentWorkload}</span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${w.isVerified ? "status-verified" : "status-pending"}`}
                    >
                      {w.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td>{formatDate(w.createdAt)}</td>
                  <td>
                    {!w.isVerified ? (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setSelectedWorker(w);
                          setAssignedDistrict(w.assignedDistrict || "");
                        }}
                      >
                        Verify
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRevoke(w._id)}
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Verify Worker Modal */}
      <Modal
        isOpen={!!selectedWorker}
        onClose={() => {
          setSelectedWorker(null);
          setAssignedDistrict("");
        }}
        title="Verify Field Worker"
      >
        {selectedWorker && (
          <div className="verify-worker-form">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Name</span>
                <span className="detail-value">{selectedWorker.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-value">{selectedWorker.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{selectedWorker.phone || "—"}</span>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label>Assigned District (optional)</label>
              <input
                type="text"
                value={assignedDistrict}
                onChange={(e) => setAssignedDistrict(e.target.value)}
                placeholder="e.g. Chennai North"
              />
            </div>
            <div className="form-actions" style={{ marginTop: "1rem" }}>
              <button
                className="btn btn-primary"
                onClick={() => handleVerify(selectedWorker._id)}
              >
                Approve & Verify
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setSelectedWorker(null);
                  setAssignedDistrict("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Workers;
