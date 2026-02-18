import { useState } from "react";

const INITIAL = {
  asset_id: "",
  asset_type: "",
  district_name: "",
  ward_id: "",
  longitude: "",
  latitude: "",
  last_maintenance_date: "",
  estimated_repair_cost: "",
  service_radius: "",
};

const ASSET_TYPES = [
  "Road",
  "Bridge",
  "Drainage",
  "Street Light",
  "Water Pipeline",
  "Sewage",
  "Park",
  "Public Toilet",
  "Bus Stop",
  "Footpath",
];

const AssetCreateModal = ({ onSave, onCancel, saving }) => {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.asset_id.trim()) errs.asset_id = "Required";
    if (!form.asset_type) errs.asset_type = "Required";
    if (!form.district_name.trim()) errs.district_name = "Required";
    if (!form.ward_id.trim()) errs.ward_id = "Required";
    if (!form.longitude || isNaN(form.longitude)) errs.longitude = "Valid longitude required";
    if (!form.latitude || isNaN(form.latitude)) errs.latitude = "Valid latitude required";
    if (!form.last_maintenance_date) errs.last_maintenance_date = "Required";
    if (!form.estimated_repair_cost || Number(form.estimated_repair_cost) < 0)
      errs.estimated_repair_cost = "Valid cost required";
    if (!form.service_radius || Number(form.service_radius) <= 0)
      errs.service_radius = "Valid radius required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      asset_id: form.asset_id.trim(),
      asset_type: form.asset_type,
      district_name: form.district_name.trim(),
      ward_id: form.ward_id.trim(),
      location: {
        type: "Point",
        coordinates: [Number(form.longitude), Number(form.latitude)],
      },
      last_maintenance_date: form.last_maintenance_date,
      estimated_repair_cost: Number(form.estimated_repair_cost),
      service_radius: Number(form.service_radius),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="asset-create-form">
      <div className="form-grid">
        {/* Asset ID */}
        <div className="form-group">
          <label htmlFor="c-asset-id">Asset ID</label>
          <input
            id="c-asset-id"
            type="text"
            placeholder="e.g. ROAD-001"
            value={form.asset_id}
            onChange={set("asset_id")}
          />
          {errors.asset_id && <span className="field-error">{errors.asset_id}</span>}
        </div>

        {/* Type */}
        <div className="form-group">
          <label htmlFor="c-asset-type">Asset Type</label>
          <select id="c-asset-type" value={form.asset_type} onChange={set("asset_type")}>
            <option value="">Select type...</option>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.asset_type && <span className="field-error">{errors.asset_type}</span>}
        </div>

        {/* District */}
        <div className="form-group">
          <label htmlFor="c-district">District</label>
          <input
            id="c-district"
            type="text"
            placeholder="e.g. Zone 1"
            value={form.district_name}
            onChange={set("district_name")}
          />
          {errors.district_name && <span className="field-error">{errors.district_name}</span>}
        </div>

        {/* Ward */}
        <div className="form-group">
          <label htmlFor="c-ward">Ward ID</label>
          <input
            id="c-ward"
            type="text"
            placeholder="e.g. W-12"
            value={form.ward_id}
            onChange={set("ward_id")}
          />
          {errors.ward_id && <span className="field-error">{errors.ward_id}</span>}
        </div>

        {/* Longitude */}
        <div className="form-group">
          <label htmlFor="c-lng">Longitude</label>
          <input
            id="c-lng"
            type="number"
            step="any"
            placeholder="e.g. 80.2707"
            value={form.longitude}
            onChange={set("longitude")}
          />
          {errors.longitude && <span className="field-error">{errors.longitude}</span>}
        </div>

        {/* Latitude */}
        <div className="form-group">
          <label htmlFor="c-lat">Latitude</label>
          <input
            id="c-lat"
            type="number"
            step="any"
            placeholder="e.g. 13.0827"
            value={form.latitude}
            onChange={set("latitude")}
          />
          {errors.latitude && <span className="field-error">{errors.latitude}</span>}
        </div>

        {/* Maintenance Date */}
        <div className="form-group">
          <label htmlFor="c-maint">Last Maintenance Date</label>
          <input
            id="c-maint"
            type="date"
            value={form.last_maintenance_date}
            onChange={set("last_maintenance_date")}
          />
          {errors.last_maintenance_date && (
            <span className="field-error">{errors.last_maintenance_date}</span>
          )}
        </div>

        {/* Repair Cost */}
        <div className="form-group">
          <label htmlFor="c-cost">Estimated Repair Cost (₹)</label>
          <input
            id="c-cost"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 50000"
            value={form.estimated_repair_cost}
            onChange={set("estimated_repair_cost")}
          />
          {errors.estimated_repair_cost && (
            <span className="field-error">{errors.estimated_repair_cost}</span>
          )}
        </div>

        {/* Service Radius */}
        <div className="form-group">
          <label htmlFor="c-radius">Service Radius (m)</label>
          <input
            id="c-radius"
            type="number"
            min="1"
            placeholder="e.g. 500"
            value={form.service_radius}
            onChange={set("service_radius")}
          />
          {errors.service_radius && (
            <span className="field-error">{errors.service_radius}</span>
          )}
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
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Creating..." : "Create Asset"}
        </button>
      </div>
    </form>
  );
};

export default AssetCreateModal;
