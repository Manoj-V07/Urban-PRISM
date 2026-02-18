import { useState } from "react";
import api from "../../api/axios";
import ENDPOINTS from "../../api/endpoints";

const GrievanceForm = ({ onSuccess, onError }) => {
  const [form, setForm] = useState({
    district_name: "",
    ward_id: "",
    complaint_text: "",
    latitude: "",
    longitude: "",
  });
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [imageMismatch, setImageMismatch] = useState(null);

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
    setImageMismatch(null);

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
        district_name: "",
        ward_id: "",
        complaint_text: "",
        latitude: "",
        longitude: "",
      });
      setImage(null);
    } catch (err) {
      const resData = err.response?.data;

      if (resData?.message === "Image does not match complaint" && resData?.reason) {
        setImageMismatch(resData.reason);
      } else {
        onError?.(resData?.message || "Failed to submit grievance");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grievance-form" onSubmit={handleSubmit}>
      <div className="ai-notice">
        <span className="ai-notice-icon">🤖</span>
        <span>Category, severity, and summary will be auto-detected by AI from your complaint text.</span>
      </div>

      {imageMismatch && (
        <div className="image-mismatch-alert">
          <div className="image-mismatch-header">
            <span className="image-mismatch-icon">⚠️</span>
            <strong>Image does not match your complaint</strong>
          </div>
          <p className="image-mismatch-reason">{imageMismatch}</p>
          <p className="image-mismatch-hint">
            Please upload a relevant image that matches your complaint description and try again.
          </p>
          <button
            type="button"
            className="btn btn-sm btn-outline image-mismatch-dismiss"
            onClick={() => setImageMismatch(null)}
          >
            Dismiss
          </button>
        </div>
      )}
      <div className="form-grid">
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
