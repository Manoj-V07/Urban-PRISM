import { useEffect, useState } from "react";

const toFormState = (asset) => ({
  asset_id: asset?.asset_id || "",
  asset_type: asset?.asset_type || "",
  district_name: asset?.district_name || "",
  ward_id: asset?.ward_id || "",
  latitude: asset?.location?.coordinates?.[1] ?? "",
  longitude: asset?.location?.coordinates?.[0] ?? "",
  last_maintenance_date: asset?.last_maintenance_date
    ? new Date(asset.last_maintenance_date).toISOString().split("T")[0]
    : "",
  estimated_repair_cost: asset?.estimated_repair_cost ?? "",
  service_radius: asset?.service_radius ?? ""
});

const AssetForm = ({
  asset,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  submitLabel = "Save"
}) => {
  const [formData, setFormData] = useState(toFormState(asset));

  useEffect(() => {
    setFormData(toFormState(asset));
  }, [asset]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <form className="asset-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="asset_id">Asset ID</label>
          <input
            id="asset_id"
            name="asset_id"
            value={formData.asset_id}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="asset_type">Type</label>
          <input
            id="asset_type"
            name="asset_type"
            value={formData.asset_type}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="district_name">District</label>
          <input
            id="district_name"
            name="district_name"
            value={formData.district_name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="ward_id">Ward</label>
          <input
            id="ward_id"
            name="ward_id"
            value={formData.ward_id}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="latitude">Latitude</label>
          <input
            id="latitude"
            type="number"
            step="any"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="longitude">Longitude</label>
          <input
            id="longitude"
            type="number"
            step="any"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="last_maintenance_date">Last Maintenance</label>
          <input
            id="last_maintenance_date"
            type="date"
            name="last_maintenance_date"
            value={formData.last_maintenance_date}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="estimated_repair_cost">Repair Cost</label>
          <input
            id="estimated_repair_cost"
            type="number"
            min="0"
            name="estimated_repair_cost"
            value={formData.estimated_repair_cost}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="service_radius">Service Radius (m)</label>
          <input
            id="service_radius"
            type="number"
            min="0"
            name="service_radius"
            value={formData.service_radius}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {error && <p className="form-error-text">{error}</p>}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default AssetForm;
