import { useEffect, useMemo, useState } from "react";
import useFetch from "../hooks/useFetch";
import api from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import { WORKER_CATEGORIES } from "../utils/constants";
import Modal from "../components/common/Modal";
import Loader from "../components/common/Loader";
import Toast from "../components/common/Toast";

const FieldWorkers = () => {
  const [filter, setFilter] = useState({ verified: "", category: "" });
  const buildUrl = () => {
    const params = new URLSearchParams();
    if (filter.verified) params.set("verified", filter.verified);
    if (filter.category) params.set("category", filter.category);
    const qs = params.toString();
    return `${ENDPOINTS.FIELD_WORKERS.LIST}${qs ? `?${qs}` : ""}`;
  };

  const { data: workers, loading, refetch } = useFetch(buildUrl());
  const [toast, setToast] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const LIVE_REFRESH_MS = 12000;

  const liveMetrics = useMemo(() => {
    const list = workers || [];
    const now = lastUpdated.getTime();
    const onlineWindowMs = 3 * 60 * 1000;

    const verifiedWorkers = list.filter((w) => w.isVerified);
    const onlineWorkers = verifiedWorkers.filter((w) => {
      const updatedAt = new Date(w.updatedAt || w.createdAt || now).getTime();
      return now - updatedAt <= onlineWindowMs;
    });

    const busyWorkers = verifiedWorkers.filter((w) => (w.activeTaskCount || 0) > 0);
    const pendingWorkers = list.filter((w) => !w.isVerified);

    return {
      total: list.length,
      verified: verifiedWorkers.length,
      onlineNow: onlineWorkers.length,
      busyNow: busyWorkers.length,
      pending: pendingWorkers.length,
      onlineWindowMinutes: 3,
      byCategory: list.reduce((acc, worker) => {
        const key = worker.workerCategory || "Unspecified";
        if (!acc[key]) {
          acc[key] = { total: 0, online: 0 };
        }

        acc[key].total += 1;

        const updatedAt = new Date(worker.updatedAt || worker.createdAt || now).getTime();
        if (now - updatedAt <= onlineWindowMs && worker.isVerified) {
          acc[key].online += 1;
        }

        return acc;
      }, {}),
    };
  }, [lastUpdated, workers]);

  useEffect(() => {
    setLastUpdated(new Date());
  }, [workers]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      refetch();
    }, LIVE_REFRESH_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [refetch]);

  const handleVerify = async (id) => {
    try {
      await api.patch(ENDPOINTS.FIELD_WORKERS.VERIFY(id));
      setToast({ message: "Worker verified", type: "success" });
      refetch();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed", type: "error" });
    }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(ENDPOINTS.FIELD_WORKERS.REJECT(id));
      setToast({ message: "Worker deactivated", type: "success" });
      refetch();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Failed", type: "error" });
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Field Worker Management</h2>
        <p className="text-muted">
          Verify and manage field worker accounts
        </p>
      </div>

      {/* Filters */}
      <div className="filter-bar" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <select
          value={filter.verified}
          onChange={(e) => setFilter({ ...filter, verified: e.target.value })}
          style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
        >
          <option value="">All Status</option>
          <option value="true">Verified</option>
          <option value="false">Pending</option>
        </select>
        <select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
        >
          <option value="">All Categories</option>
          {WORKER_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" onClick={refetch}>
          Apply
        </button>
        <span className="text-muted" style={{ alignSelf: "center", fontSize: "0.82rem" }}>
          Live refresh every {Math.floor(LIVE_REFRESH_MS / 1000)}s
          {lastUpdated ? ` - Last update: ${lastUpdated.toLocaleTimeString()}` : ""}
        </span>
      </div>

      <div className="summary-cards" style={{ marginBottom: "1rem" }}>
        <div className="summary-card">
          <div className="card-icon bg-blue">👷</div>
          <div>
            <p className="card-label">Total Workers</p>
            <h3 className="card-value">{liveMetrics.total}</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-green">🟢</div>
          <div>
            <p className="card-label">Online Now</p>
            <h3 className="card-value">{liveMetrics.onlineNow}</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-yellow">🛠️</div>
          <div>
            <p className="card-label">Busy Workers</p>
            <h3 className="card-value">{liveMetrics.busyNow}</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-red">⏳</div>
          <div>
            <p className="card-label">Pending Verification</p>
            <h3 className="card-value">{liveMetrics.pending}</h3>
          </div>
        </div>
      </div>

      <div className="table-container" style={{ marginBottom: "1.5rem" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Total</th>
              <th>Online</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(liveMetrics.byCategory).length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: "center", padding: "1rem" }}>
                  No category data available
                </td>
              </tr>
            ) : (
              Object.entries(liveMetrics.byCategory).map(([category, stats]) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td>{stats.total}</td>
                  <td>{stats.online}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Workers Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Category</th>
              <th>Active Tasks</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(workers || []).length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                  No field workers found
                </td>
              </tr>
            ) : (
              (workers || []).map((w) => (
                <tr key={w._id}>
                  <td>{w.name}</td>
                  <td>{w.email}</td>
                  <td>
                    <span className="badge" style={{ background: "#e0e7ff", color: "#3730a3" }}>
                      {w.workerCategory}
                    </span>
                  </td>
                  <td>{w.activeTaskCount || 0}</td>
                  <td>
                    {(() => {
                      const updatedAt = new Date(w.updatedAt || w.createdAt || Date.now()).getTime();
                      const isOnline = Date.now() - updatedAt <= liveMetrics.onlineWindowMinutes * 60 * 1000 && w.isVerified;
                      return (
                        <span
                          className="badge"
                          style={{
                            marginRight: "0.45rem",
                            background: isOnline ? "#dcfce7" : "#e5e7eb",
                            color: isOnline ? "#166534" : "#374151",
                          }}
                        >
                          {isOnline ? "Online" : "Offline"}
                        </span>
                      );
                    })()}
                    <span
                      className="badge"
                      style={{
                        background: w.isVerified ? "#d1fae5" : "#fef3c7",
                        color: w.isVerified ? "#065f46" : "#92400e"
                      }}
                    >
                      {w.isVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td>{new Date(w.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {!w.isVerified ? (
                        <button
                          className="btn btn-sm"
                          style={{ background: "#22c55e", color: "#fff" }}
                          onClick={() => handleVerify(w._id)}
                        >
                          Verify
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm"
                          style={{ background: "#ef4444", color: "#fff" }}
                          onClick={() => handleReject(w._id)}
                        >
                          Deactivate
                        </button>
                      )}
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setSelectedWorker(w)}
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Worker Detail Modal */}
      <Modal
        isOpen={!!selectedWorker}
        onClose={() => setSelectedWorker(null)}
        title="Worker Details"
      >
        {selectedWorker && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div><strong>Name:</strong> {selectedWorker.name}</div>
            <div><strong>Email:</strong> {selectedWorker.email}</div>
            <div><strong>Category:</strong> {selectedWorker.workerCategory}</div>
            <div><strong>Active Tasks:</strong> {selectedWorker.activeTaskCount || 0}</div>
            <div>
              <strong>Status:</strong>{" "}
              <span
                className="badge"
                style={{
                  background: selectedWorker.isVerified ? "#d1fae5" : "#fef3c7",
                  color: selectedWorker.isVerified ? "#065f46" : "#92400e"
                }}
              >
                {selectedWorker.isVerified ? "Verified" : "Pending Verification"}
              </span>
            </div>
            <div><strong>Registered:</strong> {new Date(selectedWorker.createdAt).toLocaleString()}</div>
            {selectedWorker.location?.coordinates && (
              <div>
                <strong>Last Location:</strong>{" "}
                {selectedWorker.location.coordinates[1].toFixed(4)},{" "}
                {selectedWorker.location.coordinates[0].toFixed(4)}
              </div>
            )}
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

export default FieldWorkers;
