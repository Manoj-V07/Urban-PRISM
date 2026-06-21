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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  const { data: predictiveMaintenance } = useFetch(
    ENDPOINTS.DASHBOARD.PREDICTIVE_MAINTENANCE
  );
  const [running, setRunning] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);

  const predictiveAssets = predictiveMaintenance?.topRiskAssets?.slice(0, 8) || [];
  const predictiveAverageLikelihood = predictiveAssets.length
    ? Math.round(
        predictiveAssets.reduce(
          (sum, asset) => sum + Number(asset.failureLikelihood || 0),
          0
        ) / predictiveAssets.length
      )
    : 0;
  const predictiveHighestLikelihood = predictiveAssets.length
    ? Math.max(...predictiveAssets.map((asset) => Number(asset.failureLikelihood || 0)))
    : 0;

  const getPredictiveRiskClass = (riskBand) => {
    const normalized = String(riskBand || "").toLowerCase();
    if (normalized === "high") return "predictive-risk-high";
    if (normalized === "medium") return "predictive-risk-medium";
    return "predictive-risk-low";
  };

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

  const handleDownloadReport = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const palette = {
      primary: [15, 23, 42],
      accent: [14, 116, 144],
      light: [240, 249, 255],
      grid: [203, 213, 225],
      text: [30, 41, 59],
    };
    let cursorY = 120;

    const drawSectionTitle = (title) => {
      doc.setFillColor(...palette.light);
      doc.roundedRect(margin, cursorY, contentWidth, 24, 4, 4, "F");
      doc.setTextColor(...palette.accent);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, margin + 10, cursorY + 16);
      cursorY += 34;
    };

    const drawTable = ({ head, body, columnStyles = {} }) => {
      autoTable(doc, {
        startY: cursorY,
        margin: { left: margin, right: margin },
        head,
        body,
        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 6,
          textColor: palette.text,
          lineColor: palette.grid,
          lineWidth: 0.4,
        },
        headStyles: {
          fillColor: palette.accent,
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles,
      });
      cursorY = (doc.lastAutoTable?.finalY || cursorY) + 18;
    };

    const generatedAt = new Date();
    const generatedAtText = generatedAt.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const summaryRows = [
      ["Total Clusters", String(summary?.totalClusters || 0)],
      ["Active Clusters", String(summary?.active || 0)],
      ["Top Risk Score", String(topRisks?.[0]?.score ?? "N/A")],
      ["Categories Covered", String(summary?.byCategory?.length || 0)],
      ["Wards Covered", String(summary?.byWard?.length || 0)],
      ["Monthly Complaint Entries", String(complaints?.length || 0)],
    ];

    const categoryRows = (summary?.byCategory || []).length
      ? (summary?.byCategory || []).map((item) => [
          item?._id || "Unknown",
          String(item?.totalComplaints || 0),
        ])
      : [["No Data", "0"]];

    const wardRows = (summary?.byWard || []).length
      ? (summary?.byWard || []).map((item) => [
          item?._id || "Unknown",
          String(item?.totalComplaints || 0),
        ])
      : [["No Data", "0"]];

    const riskRows = (topRisks || []).slice(0, 10).length
      ? (topRisks || []).slice(0, 10).map((risk, index) => {
          const cluster = risk?.cluster || {};
          return [
            String(index + 1),
            String(risk?.score ?? "N/A"),
            getRiskLevel(risk?.score).label,
            cluster?.category || "N/A",
            cluster?.ward_id || "N/A",
            cluster?.district_name || "N/A",
            String(cluster?.complaint_volume || 0),
            cluster?.status || "N/A",
          ];
        })
      : [["-", "-", "-", "No Data", "-", "-", "-", "-"]];

    const predictiveSummaryRows = [
      ["Assets Evaluated", String(predictiveAssets.length)],
      ["Average Failure Likelihood", `${predictiveAverageLikelihood}%`],
      ["Highest Failure Likelihood", `${predictiveHighestLikelihood}%`],
    ];

    const predictiveRows = predictiveAssets.length
      ? predictiveAssets.map((asset, index) => [
          String(index + 1),
          asset?.assetId || "N/A",
          asset?.assetType || "N/A",
          asset?.wardId || "N/A",
          String(asset?.daysSinceMaintenance ?? "N/A"),
          `${asset?.failureLikelihood ?? "N/A"}%`,
          asset?.riskBand || "Low",
          (asset?.reasonSignals || []).slice(0, 2).join(", ") || "-",
        ])
      : [["-", "No Data", "-", "-", "-", "-", "-", "-"]];

    doc.setFillColor(...palette.primary);
    doc.rect(0, 0, pageWidth, 92, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Urban-PRISM Admin Dashboard Report", margin, 38);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generated: ${generatedAtText}`, margin, 58);
    doc.text(`Generated by: ${user?.name || "Admin"}`, margin, 74);
    doc.text("Scope: Dashboard statistics snapshot", pageWidth - margin, 74, {
      align: "right",
    });
    doc.setTextColor(...palette.text);

    const kpiCards = [
      { label: "Total Clusters", value: String(summary?.totalClusters || 0) },
      { label: "Active Clusters", value: String(summary?.active || 0) },
      { label: "Top Risk Score", value: String(topRisks?.[0]?.score ?? "N/A") },
      { label: "Categories", value: String(summary?.byCategory?.length || 0) },
    ];

    const cardGap = 8;
    const cardWidth = (contentWidth - cardGap * 3) / 4;
    const cardY = cursorY;
    kpiCards.forEach((card, idx) => {
      const x = margin + idx * (cardWidth + cardGap);
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x, cardY, cardWidth, 56, 5, 5, "F");
      doc.setTextColor(...palette.accent);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(card.label, x + 8, cardY + 18);
      doc.setTextColor(...palette.primary);
      doc.setFontSize(16);
      doc.text(card.value, x + 8, cardY + 40);
    });
    cursorY += 74;
    doc.setTextColor(...palette.text);

    drawSectionTitle("Executive Summary");
    drawTable({
      head: [["Metric", "Value"]],
      body: summaryRows,
      columnStyles: {
        0: { cellWidth: 260 },
        1: { cellWidth: 120, halign: "right" },
      },
    });

    drawSectionTitle("Category Breakdown");
    drawTable({
      head: [["Category", "Complaints"]],
      body: categoryRows,
      columnStyles: {
        1: { halign: "right", cellWidth: 120 },
      },
    });

    drawSectionTitle("Ward Breakdown");
    drawTable({
      head: [["Ward", "Complaints"]],
      body: wardRows,
      columnStyles: {
        1: { halign: "right", cellWidth: 120 },
      },
    });

    drawSectionTitle("Top Risk Clusters (Top 10)");
    drawTable({
      head: [["#", "Score", "Band", "Category", "Ward", "District", "Complaints", "Status"]],
      body: riskRows,
      columnStyles: {
        0: { cellWidth: 22, halign: "center" },
        1: { cellWidth: 38, halign: "center" },
        2: { cellWidth: 52, halign: "center" },
        6: { cellWidth: 62, halign: "right" },
        7: { cellWidth: 58, halign: "center" },
      },
    });

    drawSectionTitle("Predictive Maintenance Summary");
    drawTable({
      head: [["Metric", "Value"]],
      body: predictiveSummaryRows,
      columnStyles: {
        0: { cellWidth: 260 },
        1: { cellWidth: 120, halign: "right" },
      },
    });

    drawSectionTitle("Predictive Maintenance Assets");
    drawTable({
      head: [["#", "Asset", "Type", "Ward", "Days Since Maintenance", "Likelihood", "Risk Band", "Signals"]],
      body: predictiveRows,
      columnStyles: {
        0: { cellWidth: 22, halign: "center" },
        3: { cellWidth: 40, halign: "center" },
        4: { cellWidth: 66, halign: "right" },
        5: { cellWidth: 58, halign: "right" },
        6: { cellWidth: 58, halign: "center" },
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Urban-PRISM Dashboard Report | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 20,
        { align: "center" }
      );
    }

    const fileDate = generatedAt.toISOString().slice(0, 10);
    doc.save(`admin-dashboard-report-${fileDate}.pdf`);
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
        <div className="page-actions">
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
          <button
            className="btn btn-outline"
            onClick={handleDownloadReport}
          >
            Download PDF Report
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

      <div className="section">
        <h3>Predictive Maintenance (Next 30 Days)</h3>
        <p className="text-muted" style={{ marginTop: "0.25rem" }}>
          Assets with highest likelihood of failure based on maintenance age, grievance pressure, and task signals.
        </p>
        <div className="predictive-maintenance-card">
          <div className="predictive-stats-row">
            <div className="predictive-stat-item">
              <p className="card-label">Assets Evaluated</p>
              <h4 className="predictive-stat-value">{predictiveAssets.length}</h4>
            </div>
            <div className="predictive-stat-item">
              <p className="card-label">Average Likelihood</p>
              <h4 className="predictive-stat-value">{predictiveAverageLikelihood}%</h4>
            </div>
            <div className="predictive-stat-item">
              <p className="card-label">Highest Likelihood</p>
              <h4 className="predictive-stat-value">{predictiveHighestLikelihood}%</h4>
            </div>
          </div>

          <div className="table-container predictive-table-wrap" style={{ overflowX: "auto" }}>
            <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Ward</th>
                <th>Days Since Maintenance</th>
                <th>Failure Likelihood</th>
                <th>Risk Band</th>
                <th>Signals</th>
              </tr>
            </thead>
            <tbody>
              {predictiveAssets.length ? (
                predictiveAssets.map((asset) => (
                  <tr key={asset.assetId}>
                    <td>
                      <span className="predictive-asset-id" title={asset.assetId}>
                        {asset.assetId}
                      </span>
                    </td>
                    <td>{asset.assetType}</td>
                    <td>{asset.wardId}</td>
                    <td>{asset.daysSinceMaintenance}</td>
                    <td>
                      <div className="predictive-likelihood-cell">
                        <strong>{asset.failureLikelihood}%</strong>
                        <div className="predictive-likelihood-track">
                          <div
                            className="predictive-likelihood-fill"
                            style={{ width: `${Math.min(100, Number(asset.failureLikelihood || 0))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`predictive-risk-pill ${getPredictiveRiskClass(
                          asset.riskBand
                        )}`}
                      >
                        {asset.riskBand || "Low"}
                      </span>
                    </td>
                    <td>
                      <div className="predictive-signal-list">
                        {(asset.reasonSignals || []).length ? (
                          (asset.reasonSignals || []).slice(0, 2).map((signal) => (
                            <span key={`${asset.assetId}-${signal}`} className="predictive-signal-chip">
                              {signal}
                            </span>
                          ))
                        ) : (
                          <span className="predictive-signal-chip">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-muted">
                    No predictive maintenance data available yet.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
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