import { useState } from "react";
import api from "../../api/axios";
import ENDPOINTS from "../../api/endpoints";
import { CATEGORIES, SEVERITY_LEVELS } from "../../utils/constants";

const GrievanceForm = ({ onSuccess, onError }) => {
  const [form, setForm] = useState({
    category: "",
    district_name: "",
    ward_id: "",
    complaint_text: "",
    severity_level: "",
    latitude: "",
    longitude: "",
  });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((prev) => ({
            ...prev,
            latitude: pos.coords.latitude.toString(),
            longitude: pos.coords.longitude.toString(),
          }));
          setGettingLocation(false);
        },
        () => {
          setGettingLocation(false);
          onError?.("Failed to get location");
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return onError?.("Please upload an image");
    setSubmitting(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        formData.append(key, value)
      );
      formData.append("image", image);

      const { data } = await api.post(ENDPOINTS.GRIEVANCES.CREATE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSuccess?.(data);
      setForm({
        category: "",
        district_name: "",
        ward_id: "",
        complaint_text: "",
        severity_level: "",
        latitude: "",
        longitude: "",
      });
      setImage(null);
    } catch (err) {
      onError?.(
        err.response?.data?.message || "Failed to submit grievance"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grievance-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label>Category *</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Severity *</label>
          <select
            name="severity_level"
            value={form.severity_level}
            onChange={handleChange}
            required
          >
            <option value="">Select severity</option>
            {SEVERITY_LEVELS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>District *</label>
          <input
            name="district_name"
            value={form.district_name}
            onChange={handleChange}
            placeholder="District name"
            required
          />
        </div>

        <div className="form-group">
          <label>Ward ID *</label>
          <input
            name="ward_id"
            value={form.ward_id}
            onChange={handleChange}
            placeholder="Ward ID"
            required
          />
        </div>

        <div className="form-group">
          <label>Latitude *</label>
          <input
            name="latitude"
            value={form.latitude}
            onChange={handleChange}
            placeholder="Latitude"
            required
            type="number"
            step="any"
          />
        </div>

        <div className="form-group">
          <label>Longitude *</label>
          <input
            name="longitude"
            value={form.longitude}
            onChange={handleChange}
            placeholder="Longitude"
            required
            type="number"
            step="any"
          />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-outline btn-sm location-btn"
        onClick={handleGetLocation}
        disabled={gettingLocation}
      >
        {gettingLocation ? "Getting location..." : "📍 Use My Location"}
      </button>

      <div className="form-group">
        <label>Complaint Details *</label>
        <textarea
          name="complaint_text"
          value={form.complaint_text}
          onChange={handleChange}
          placeholder="Describe your complaint in detail..."
          required
          rows={4}
        />
      </div>

      <div className="form-group">
        <label>Upload Image *</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={submitting}
      >
        {submitting ? "Submitting..." : "Submit Complaint"}
      </button>
    </form>
  );
};

export default GrievanceForm;
