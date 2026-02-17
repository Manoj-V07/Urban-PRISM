import { formatDate, formatCurrency } from "../../utils/formatters";

const AssetForm = ({ asset }) => {
  if (!asset) return null;

  return (
    <div className="asset-detail">
      <h4>Asset Details</h4>
      <div className="detail-grid">
        <div className="detail-item">
          <span className="detail-label">Asset ID</span>
          <span className="detail-value">{asset.asset_id}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Type</span>
          <span className="detail-value">{asset.asset_type}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">District</span>
          <span className="detail-value">{asset.district_name}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Ward</span>
          <span className="detail-value">{asset.ward_id}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Last Maintenance</span>
          <span className="detail-value">
            {formatDate(asset.last_maintenance_date)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Repair Cost</span>
          <span className="detail-value">
            {formatCurrency(asset.estimated_repair_cost)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Service Radius</span>
          <span className="detail-value">{asset.service_radius}m</span>
        </div>
      </div>
    </div>
  );
};

export default AssetForm;
