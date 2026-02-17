import { getRiskLevel } from "../../utils/helpers";
import { formatCurrency } from "../../utils/formatters";

const RiskTable = ({ risks, onRowClick }) => {
  if (!risks?.length) {
    return (
      <p className="no-data">
        No risk data available. Run the risk engine first.
      </p>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Category</th>
            <th>Ward</th>
            <th>District</th>
            <th>Risk Score</th>
            <th>Complaints</th>
            <th>Repair Cost</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {risks.map((risk, i) => {
            const level = getRiskLevel(risk.score);
            const cluster = risk.cluster;
            return (
              <tr
                key={risk._id}
                onClick={() => onRowClick?.(risk)}
                className="table-row-clickable"
              >
                <td>{i + 1}</td>
                <td>{cluster?.category || "N/A"}</td>
                <td>{cluster?.ward_id || "N/A"}</td>
                <td>{cluster?.district_name || "N/A"}</td>
                <td>
                  <span
                    className="risk-badge"
                    style={{ backgroundColor: level.color }}
                  >
                    {risk.score} — {level.label}
                  </span>
                </td>
                <td>{cluster?.complaint_volume || 0}</td>
                <td>
                  {formatCurrency(
                    cluster?.asset_ref?.estimated_repair_cost
                  )}
                </td>
                <td>
                  <span
                    className={`status-badge status-${cluster?.status?.toLowerCase()}`}
                  >
                    {cluster?.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RiskTable;
