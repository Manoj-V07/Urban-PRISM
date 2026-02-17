import useFetch from "../hooks/useFetch";
import ENDPOINTS from "../api/endpoints";
import { BarChart, TrendChart } from "../components/dashboard/Charts";
import Loader from "../components/common/Loader";

const Analytics = () => {
  const { data: summary, loading: l1 } = useFetch(
    ENDPOINTS.DASHBOARD.SUMMARY
  );
  const { data: trend, loading: l2 } = useFetch(
    ENDPOINTS.DASHBOARD.RISK_TREND
  );
  const { data: complaints, loading: l3 } = useFetch(
    ENDPOINTS.DASHBOARD.COMPLAINTS
  );
  const { data: topRisks, loading: l4 } = useFetch(
    ENDPOINTS.DASHBOARD.TOP_RISKS
  );

  if (l1 || l2 || l3 || l4) {
    return <Loader text="Loading analytics..." />;
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h2>Analytics</h2>
        <p className="text-muted">
          Detailed analysis of urban risk data
        </p>
      </div>

      <div className="charts-row">
        <div className="chart-card full">
          <TrendChart data={trend} title="Risk Score Trend (30 Days)" />
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <BarChart
            data={complaints}
            labelKey="_id"
            valueKey="count"
            title="Monthly Complaints"
            color="#6366f1"
          />
        </div>
        <div className="chart-card">
          <BarChart
            data={summary?.byCategory}
            labelKey="_id"
            valueKey="count"
            title="Clusters by Category"
            color="#f59e0b"
          />
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <BarChart
            data={summary?.byWard}
            labelKey="_id"
            valueKey="count"
            title="Clusters by Ward"
            color="#14b8a6"
          />
        </div>
        <div className="chart-card">
          <h4 className="chart-title">Risk Distribution</h4>
          {topRisks?.length ? (
            <div className="risk-distribution">
              {["Critical", "High", "Medium", "Low"].map((level) => {
                const count = topRisks.filter((r) => {
                  const s = r.score;
                  if (level === "Critical") return s >= 70;
                  if (level === "High") return s >= 50 && s < 70;
                  if (level === "Medium") return s >= 30 && s < 50;
                  return s < 30;
                }).length;
                const colors = {
                  Critical: "#ef4444",
                  High: "#f97316",
                  Medium: "#f59e0b",
                  Low: "#22c55e",
                };
                return (
                  <div key={level} className="distribution-item">
                    <span
                      className="distribution-dot"
                      style={{ backgroundColor: colors[level] }}
                    />
                    <span className="distribution-label">{level}</span>
                    <span className="distribution-count">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-data">No risk data</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
