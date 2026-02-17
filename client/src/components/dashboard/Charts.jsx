const BarChart = ({ data, labelKey, valueKey, title, color = "#3b82f6" }) => {
  if (!data?.length) return <p className="no-data">No data available</p>;
  const maxVal = Math.max(...data.map((d) => d[valueKey]));

  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="bar-chart">
        {data.map((item, i) => (
          <div key={i} className="bar-item">
            <div className="bar-label">{item[labelKey] || "N/A"}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${maxVal > 0 ? (item[valueKey] / maxVal) * 100 : 0}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <div className="bar-value">{item[valueKey]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TrendChart = ({ data, title }) => {
  if (!data?.length) return <p className="no-data">No data available</p>;
  const maxVal = Math.max(...data.map((d) => d.avgRisk || d.count));
  const height = 200;

  return (
    <div className="chart-container">
      {title && <h4 className="chart-title">{title}</h4>}
      <div className="trend-chart" style={{ height }}>
        <div className="trend-bars">
          {data.map((item, i) => {
            const val = item.avgRisk ?? item.count;
            const barHeight =
              maxVal > 0 ? (val / maxVal) * (height - 40) : 0;
            return (
              <div key={i} className="trend-bar-group">
                <div className="trend-bar-value">{Math.round(val)}</div>
                <div
                  className="trend-bar"
                  style={{
                    height: barHeight,
                    backgroundColor:
                      val > 60
                        ? "#ef4444"
                        : val > 30
                          ? "#f59e0b"
                          : "#22c55e",
                  }}
                />
                <div className="trend-bar-label">
                  {item._id?.slice(5) || ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { BarChart, TrendChart };
