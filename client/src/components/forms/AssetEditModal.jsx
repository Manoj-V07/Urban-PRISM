import { useState, useEffect } from "react";
import { formatDate, formatCurrency } from "../../utils/formatters";

const AssetEditModal = ({ asset, onSave, onCancel, saving }) => {
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [repairCost, setRepairCost] = useState("");

  useEffect(() => {
    if (asset) {
      // Format date as YYYY-MM-DD for input[type=date]
      const d = asset.last_maintenance_date
        ? new Date(asset.last_maintenance_date).toISOString().split("T")[0]
        : "";
      setMaintenanceDate(d);
      setRepairCost(asset.estimated_repair_cost ?? "");
    }
  }, [asset]);

  if (!asset) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      last_maintenance_date: maintenanceDate,
      estimated_repair_cost: Number(repairCost),
    });
  };

  const hasChanges = () => {
    const origDate = asset.last_maintenance_date
      ? new Date(asset.last_maintenance_date).toISOString().split("T")[0]
      : "";
    return (
      maintenanceDate !== origDate ||
      Number(repairCost) !== asset.estimated_repair_cost
    );
  };

  return (
    <div className="asset-edit-modal">
      {/* Read-only asset info */}
      <div className="detail-grid" style={{ marginBottom: "1.5rem" }}>
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
          <span className="detail-label">Service Radius</span>
          <span className="detail-value">{asset.service_radius}m</span>
        </div>
      </div>

      {/* Editable fields */}
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="maintenanceDate">Last Maintenance Date</label>
            <input
              id="maintenanceDate"
              type="date"
              value={maintenanceDate}
              onChange={(e) => setMaintenanceDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="repairCost">Estimated Repair Cost (₹)</label>
            <input
              id="repairCost"
              type="number"
              min="0"
              step="1"
              value={repairCost}
              onChange={(e) => setRepairCost(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || !hasChanges()}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssetEditModal;
