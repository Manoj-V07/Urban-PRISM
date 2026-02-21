/** Compute human-readable duration from a date to now */
const getDuration = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
};

const BarChart = ({ data, labelKey, valueKey, title, color = "#3b82f6", variant }) => {
  if (!data?.length) return <p className="no-data">No data available</p>;
  const maxVal = Math.max(...data.map((d) => d[valueKey]));

  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="detail-bar-chart">
        {data.map((item, i) => {
          const pct = maxVal > 0 ? (item[valueKey] / maxVal) * 100 : 0;
          return (
            <div key={i} className="detail-bar-row">
              {/* Top: label + stats */}
              <div className="detail-bar-header">
                <span className="detail-bar-name">{item[labelKey] || "N/A"}</span>
                <div className="detail-bar-stats">
                  {/* Variant-specific detail chips */}
                  {variant === "category" && (
                    <>
                      <span className="chip chip-blue">{item.count} cluster{item.count !== 1 ? "s" : ""}</span>
                      <span className="chip chip-orange">{item.totalComplaints ?? item[valueKey]} complaints</span>
                      {item.oldestCluster && (
                        <span className="chip chip-gray" title={`Since ${new Date(item.oldestCluster).toLocaleDateString()}`}>⏱ {getDuration(item.oldestCluster)}</span>
                      )}
                    </>
                  )}
                  {variant === "ward" && (
                    <>
                      <span className="chip chip-teal">{item.count} cluster{item.count !== 1 ? "s" : ""}</span>
                      <span className="chip chip-orange">{item.totalComplaints ?? item[valueKey]} complaints</span>
                      {item.oldestCluster && (
                        <span className="chip chip-gray" title={`Since ${new Date(item.oldestCluster).toLocaleDateString()}`}>⏱ {getDuration(item.oldestCluster)}</span>
                      )}
                    </>
                  )}
                  {variant === "complaints" && (
                    <>
                      <span className="chip chip-orange">{item.count} total</span>
                      {item.pending != null && <span className="chip chip-red">{item.pending} pending</span>}
                      {item.resolved != null && <span className="chip chip-green">{item.resolved} resolved</span>}
                      {item.highSeverity > 0 && <span className="chip chip-red-fill">⚠ {item.highSeverity} high</span>}
                      {item.oldestComplaint && (
                        <span className="chip chip-gray" title={`Since ${new Date(item.oldestComplaint).toLocaleDateString()}`}>⏱ {getDuration(item.oldestComplaint)}</span>
                      )}
                    </>
                  )}
                  {!variant && (
                    <span className="chip chip-blue">{item[valueKey]}</span>
                  )}
                </div>
              </div>
              {/* Bar */}
              <div className="detail-bar-track">
                <div
                  className="detail-bar-fill"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
                <span className="detail-bar-value">{item[valueKey]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TrendChart = ({ data, title }) => {
  if (!data?.length) return <p className="no-data">No data available</p>;

  const values = data.map((d) => d.avgRisk ?? d.count);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);

  // Chart dimensions
  const width = 500;
  const height = 240;
  const padTop = 30;
  const padBottom = 55;
  const padLeft = 55;
  const padRight = 20;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Scale helpers
  const range = maxVal - minVal || 1;
  const scaleY = (v) => padTop + chartH - ((v - minVal) / range) * chartH;
  const scaleX = (i) =>
    padLeft + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW);

  // Build polyline & area paths
  const points = values.map((v, i) => `${scaleX(i)},${scaleY(v)}`);
  const linePath = `M${points.join(" L")}`;
  const areaPath = `${linePath} L${scaleX(data.length - 1)},${padTop + chartH} L${scaleX(0)},${padTop + chartH} Z`;

  // Y-axis grid lines (5 ticks)
  const ticks = 5;
  const yTicks = Array.from({ length: ticks }, (_, i) => {
    const val = minVal + (range / (ticks - 1)) * i;
    return { val: Math.round(val), y: scaleY(val) };
  });

  // Color for a value
  const getColor = (v) =>
    v > 60 ? "#ef4444" : v > 30 ? "#f59e0b" : "#22c55e";

  const latestVal = values[values.length - 1];
  const prevVal = values.length > 1 ? values[values.length - 2] : latestVal;
  const delta = latestVal - prevVal;
  const primaryColor = getColor(latestVal);

  return (
    <div className="chart-container">
      {title && (
        <div className="trend-header">
          <h4 className="chart-title">{title}</h4>
          <div className="trend-legend">
            <span
              className="trend-current"
              style={{ color: primaryColor }}
            >
              {Math.round(latestVal)}
            </span>
            {delta !== 0 && (
              <span
                className={`trend-delta ${delta > 0 ? "trend-up" : "trend-down"}`}
              >
                {delta > 0 ? "▲" : "▼"} {Math.abs(Math.round(delta))}
              </span>
            )}
          </div>
        </div>
      )}
      <svg
        className="trend-line-svg"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Gradient fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis grid + labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              y1={t.y}
              x2={width - padRight}
              y2={t.y}
              stroke="var(--border-light, #e5e7eb)"
              strokeDasharray="4 3"
            />
            <text
              x={padLeft - 8}
              y={t.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-muted, #9ca3af)"
            >
              {t.val}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={primaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points + labels */}
        {values.map((v, i) => (
          <g key={i}>
            <circle
              cx={scaleX(i)}
              cy={scaleY(v)}
              r="4.5"
              fill="#fff"
              stroke={getColor(v)}
              strokeWidth="2.5"
            />
            <text
              x={scaleX(i)}
              y={scaleY(v) - 10}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="var(--text, #111827)"
            >
              {Math.round(v)}
            </text>
            {/* X-axis label (date) */}
            <text
              x={scaleX(i)}
              y={padTop + chartH + 18}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-muted, #9ca3af)"
            >
              {data[i]._id?.slice(5) || ""}
            </text>
          </g>
        ))}

        {/* Y-axis label */}
        <text
          x={14}
          y={(padTop + padTop + chartH) / 2}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="var(--text-muted, #6b7280)"
          transform={`rotate(-90, 14, ${(padTop + padTop + chartH) / 2})`}
        >
          Risk Score
        </text>

        {/* X-axis label */}
        <text
          x={padLeft + chartW / 2}
          y={height - 4}
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          fill="var(--text-muted, #6b7280)"
        >
          Date
        </text>
      </svg>
    </div>
  );
};

/** Complaint Summary — donut + stat cards (replaces sparse bar chart) */
const ComplaintSummary = ({ data, title }) => {
  if (!data?.length) return <p className="no-data">No data available</p>;

  // Aggregate across all months
  const totals = data.reduce(
    (acc, m) => {
      acc.total += m.count || 0;
      acc.pending += m.pending || 0;
      acc.resolved += m.resolved || 0;
      acc.high += m.highSeverity || 0;
      return acc;
    },
    { total: 0, pending: 0, resolved: 0, high: 0 }
  );

  const resolvePct = totals.total > 0 ? Math.round((totals.resolved / totals.total) * 100) : 0;
  const pendPct = totals.total > 0 ? Math.round((totals.pending / totals.total) * 100) : 0;

  // Oldest complaint across all months
  const oldest = data
    .map((m) => m.oldestComplaint)
    .filter(Boolean)
    .sort()[0];

  // SVG donut params
  const size = 120;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const resolvedDash = (resolvePct / 100) * circ;

  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="cs-layout">
        {/* Donut */}
        <div className="cs-donut-wrap">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke="#f3f4f6" strokeWidth={stroke}
            />
            <circle
              cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke="#22c55e" strokeWidth={stroke}
              strokeDasharray={`${resolvedDash} ${circ}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dasharray 0.6s ease" }}
            />
          </svg>
          <div className="cs-donut-label">
            <span className="cs-donut-pct">{resolvePct}%</span>
            <span className="cs-donut-sub">Resolved</span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="cs-stats">
          <div className="cs-stat-card cs-total">
            <span className="cs-stat-num">{totals.total}</span>
            <span className="cs-stat-label">Total Complaints</span>
          </div>
          <div className="cs-stat-card cs-pending">
            <span className="cs-stat-num">{totals.pending}</span>
            <span className="cs-stat-label">Pending ({pendPct}%)</span>
          </div>
          <div className="cs-stat-card cs-resolved">
            <span className="cs-stat-num">{totals.resolved}</span>
            <span className="cs-stat-label">Resolved ({resolvePct}%)</span>
          </div>
          <div className="cs-stat-card cs-high">
            <span className="cs-stat-num">{totals.high}</span>
            <span className="cs-stat-label">⚠ High Severity</span>
          </div>
        </div>
      </div>

      {/* Monthly breakdown rows */}
      {data.length > 0 && (
        <div className="cs-months">
          {data.map((m, i) => (
            <div key={i} className="cs-month-row">
              <span className="cs-month-name">{m._id || "Unknown"}</span>
              <div className="cs-month-bar-track">
                <div
                  className="cs-month-bar-resolved"
                  style={{ width: `${m.count > 0 ? (m.resolved / m.count) * 100 : 0}%` }}
                />
                <div
                  className="cs-month-bar-pending"
                  style={{ width: `${m.count > 0 ? (m.pending / m.count) * 100 : 0}%` }}
                />
              </div>
              <span className="cs-month-count">{m.count}</span>
              {m.oldestComplaint && (
                <span className="cs-month-age" title={`Since ${new Date(m.oldestComplaint).toLocaleDateString()}`}>
                  ⏱ {getDuration(m.oldestComplaint)}
                </span>
              )}
            </div>
          ))}
          <div className="cs-legend">
            <span className="cs-legend-item"><span className="cs-dot cs-dot-green" /> Resolved</span>
            <span className="cs-legend-item"><span className="cs-dot cs-dot-amber" /> Pending</span>
          </div>
        </div>
      )}
    </div>
  );
};

export { BarChart, TrendChart, ComplaintSummary };
