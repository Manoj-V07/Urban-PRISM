import useFetch from "../hooks/useFetch";
import ENDPOINTS from "../api/endpoints";
import { BarChart, TrendChart, ComplaintSummary } from "../components/dashboard/Charts";
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
    <div className="analytics-page ">
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
          <ComplaintSummary
            data={complaints}
            title="Monthly Complaints"
          />
        </div>
        <div className="chart-card">
          <BarChart
            data={summary?.byCategory}
            labelKey="_id"
            valueKey="totalComplaints"
            title="Clusters by Category"
            color="#f59e0b"
            variant="category"
          />
        </div>
      </div>

      <div className="charts-row">
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
        <div className="chart-card">
          <h4 className="chart-title">Risk Distribution</h4>
          {topRisks?.length ? (() => {
            const levels = ["Critical", "High", "Medium", "Low"];
            const colors = {
              Critical: "#ef4444",
              High: "#f97316",
              Medium: "#f59e0b",
              Low: "#22c55e",
            };
            const counts = {};
            levels.forEach((l) => {
              counts[l] = topRisks.filter((r) => {
                const s = r.score;
                if (l === "Critical") return s >= 70;
                if (l === "High") return s >= 50 && s < 70;
                if (l === "Medium") return s >= 30 && s < 50;
                return s < 30;
              }).length;
            });
            const total = topRisks.length;
            // Donut SVG
            const size = 110;
            const stroke = 14;
            const r = (size - stroke) / 2;
            const circ = 2 * Math.PI * r;
            let offset = 0;
            const arcs = levels.map((l) => {
              const pct = total > 0 ? counts[l] / total : 0;
              const dash = pct * circ;
              const arc = { level: l, dash, gap: circ - dash, offset, color: colors[l] };
              offset += dash;
              return arc;
            });

            return (
              <div className="rd-layout">
                <div className="rd-donut-wrap">
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
                    {arcs.map((a) => (
                      a.dash > 0 && (
                        <circle
                          key={a.level}
                          cx={size/2} cy={size/2} r={r} fill="none"
                          stroke={a.color} strokeWidth={stroke}
                          strokeDasharray={`${a.dash} ${a.gap}`}
                          strokeDashoffset={-a.offset}
                          transform={`rotate(-90 ${size/2} ${size/2})`}
                          style={{ transition: "stroke-dasharray 0.6s ease" }}
                        />
                      )
                    ))}
                  </svg>
                  <div className="rd-donut-label">
                    <span className="rd-donut-total">{total}</span>
                    <span className="rd-donut-sub">Clusters</span>
                  </div>
                </div>

                <div className="rd-bars">
                  {levels.map((l) => {
                    const pct = total > 0 ? Math.round((counts[l] / total) * 100) : 0;
                    return (
                      <div key={l} className="rd-bar-row">
                        <span className="rd-bar-dot" style={{ background: colors[l] }} />
                        <span className="rd-bar-label">{l}</span>
                        <div className="rd-bar-track">
                          <div className="rd-bar-fill" style={{ width: `${pct}%`, background: colors[l] }} />
                        </div>
                        <span className="rd-bar-count">{counts[l]}</span>
                        <span className="rd-bar-pct">({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })() : (
            <p className="no-data">No risk data</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
