import { useState } from "react";
import useFetch from "../hooks/useFetch";
import useAuth from "../hooks/useAuth";
import ENDPOINTS from "../api/endpoints";
import api from "../api/axios";
import RiskTable from "../components/dashboard/RiskTable";
import { BarChart, TrendChart, ComplaintSummary } from "../components/dashboard/Charts";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";
import AssetForm from "../components/forms/AssetForm";
import { getRiskLevel } from "../utils/helpers";

const Dashboard = () => {
  const { user } = useAuth();
  const {
    data: topRisks,
    loading: loadingRisks,
    refetch: refetchRisks,
  } = useFetch(ENDPOINTS.DASHBOARD.TOP_RISKS);
  const { data: summary, loading: loadingSummary } = useFetch(
    ENDPOINTS.DASHBOARD.SUMMARY
  );
  const { data: trend } = useFetch(ENDPOINTS.DASHBOARD.RISK_TREND);
  const { data: complaints } = useFetch(ENDPOINTS.DASHBOARD.COMPLAINTS);
  const [running, setRunning] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);

  const handleRunRisk = async () => {
    setRunning(true);
    try {
      const { data } = await api.post(ENDPOINTS.RISK.RUN);
      alert(`Risk engine completed. ${data.generated} scores generated.`);
      refetchRisks();
    } catch (err) {
      alert(err.response?.data?.message || "Risk engine failed");
    } finally {
      setRunning(false);
    }
  };

  const handleSendAlert = async () => {
    setSendingAlert(true);
    try {
      const { data } = await api.post(ENDPOINTS.DASHBOARD.SEND_ALERT);
      alert(data.message || "Alert sent!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send alert");
    } finally {
      setSendingAlert(false);
    }
  };

  if (loadingRisks || loadingSummary) {
    return <Loader text="Loading dashboard..." />;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="text-muted">Welcome back, {user?.name}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="btn btn-primary"
            onClick={handleRunRisk}
            disabled={running}
          >
            {running ? "Running..." : "⚡ Run Risk Engine"}
          </button>
          <button
            className="btn btn-danger"
            onClick={handleSendAlert}
            disabled={sendingAlert}
          >
            {sendingAlert ? "Sending..." : "📧 Send Cluster Alert"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon bg-blue">📊</div>
          <div>
            <p className="card-label">Total Clusters</p>
            <h3 className="card-value">{summary?.totalClusters || 0}</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-yellow">🔥</div>
          <div>
            <p className="card-label">Active Clusters</p>
            <h3 className="card-value">{summary?.active || 0}</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-red">⚠️</div>
          <div>
            <p className="card-label">Top Risk Score</p>
            <h3 className="card-value">
              {topRisks?.[0]?.score || "N/A"}
            </h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-green">📋</div>
          <div>
            <p className="card-label">Categories</p>
            <h3 className="card-value">
              {summary?.byCategory?.length || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        <div className="chart-card">
          <TrendChart data={trend} title="Risk Trend (30 Days)" />
        </div>
        <div className="chart-card">
          <BarChart
            data={summary?.byCategory}
            labelKey="_id"
            valueKey="totalComplaints"
            title="Clusters by Category"
            color="#6366f1"
            variant="category"
          />
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <ComplaintSummary
            data={complaints}
            title="Monthly Complaints"
          />
        </div>
        <div className="chart-card">
          <BarChart
            data={summary?.byWard}
            labelKey="_id"
            valueKey="totalComplaints"
            title="Clusters by Ward"
            color="#14b8a6"
            variant="ward"
          />
        </div>
      </div>

      {/* Risk Table */}
      <div className="section">
        <h3>Top Risk Clusters</h3>
        <RiskTable risks={topRisks} onRowClick={setSelectedRisk} />
      </div>

      {/* Risk Detail Modal */}
      <Modal
        isOpen={!!selectedRisk}
        onClose={() => setSelectedRisk(null)}
        title="Risk Detail"
        size="lg"
      >
        {selectedRisk && (
          <div>
            <div className="risk-detail-header">
              <span
                className="risk-badge lg"
                style={{
                  backgroundColor: getRiskLevel(selectedRisk.score).color,
                }}
              >
                Score: {selectedRisk.score} —{" "}
                {getRiskLevel(selectedRisk.score).label}
              </span>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Category</span>
                <span className="detail-value">
                  {selectedRisk.cluster?.category}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Ward</span>
                <span className="detail-value">
                  {selectedRisk.cluster?.ward_id}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">District</span>
                <span className="detail-value">
                  {selectedRisk.cluster?.district_name}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Complaints</span>
                <span className="detail-value">
                  {selectedRisk.cluster?.complaint_volume}
                </span>
              </div>
            </div>
            {selectedRisk.breakdown && (
              <div className="breakdown-section">
                <h4>Score Breakdown</h4>
                <div className="breakdown-bars">
                  {Object.entries(selectedRisk.breakdown).map(
                    ([key, val]) => (
                      <div key={key} className="breakdown-item">
                        <span className="breakdown-label">{key}</span>
                        <div className="breakdown-bar-track">
                          <div
                            className="breakdown-bar-fill"
                            style={{ width: `${val * 100}%` }}
                          />
                        </div>
                        <span className="breakdown-value">
                          {(val * 100).toFixed(0)}%
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
            {selectedRisk.cluster?.asset_ref && (
              <AssetForm asset={selectedRisk.cluster.asset_ref} />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;