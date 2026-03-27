import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";
import ENDPOINTS from "../../api/endpoints";
import useVoiceInput from "../../hooks/useVoiceInput";
import Modal from "../common/Modal";
import {
  enqueueComplaint,
  getOfflineComplaintQueueCount,
} from "../../offline/complaintQueue";

const GrievanceForm = ({ onSuccess, onError }) => {
  const { t } = useTranslation();
  const VOICE_LANGUAGES = [
    { code: "en-IN", label: "English" },
    { code: "ta-IN", label: "Tamil" },
    { code: "hi-IN", label: "Hindi" },
  ];

  const [form, setForm] = useState({
    district_name: "",
    ward_id: "",
    complaint_text: "",
    latitude: "",
    longitude: "",
  });
  const [voiceLanguage, setVoiceLanguage] = useState("ta-IN");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [imageMismatch, setImageMismatch] = useState(null);
  const [activeVoiceField, setActiveVoiceField] = useState(null);
  const [possibleDuplicates, setPossibleDuplicates] = useState([]);
  const [showDuplicatePrompt, setShowDuplicatePrompt] = useState(false);
  const activeFieldRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Voice input hook — use ref to avoid stale closure
  const handleVoiceResult = useCallback((text) => {
    const field = activeFieldRef.current;
    if (field) {
      setForm((prev) => ({
        ...prev,
        [field]: text.trim(),
      }));
    }
  }, []);

  const {
    listening,
    supported: voiceSupported,
    start: startVoice,
    stop: stopVoice,
    interim,
  } = useVoiceInput({ lang: voiceLanguage, onResult: handleVoiceResult });

  const toggleVoice = (fieldName) => {
    if (listening && activeVoiceField === fieldName) {
      stopVoice();
      setActiveVoiceField(null);
      activeFieldRef.current = null;
    } else {
      if (listening) stopVoice();
      setActiveVoiceField(fieldName);
      activeFieldRef.current = fieldName;
      setTimeout(() => startVoice(), 50);
    }
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

    if (!form.latitude || !form.longitude || !form.ward_id || !form.district_name || !form.complaint_text) {
      onError?.("Please fill all required fields before submit");
      return;
    }

    setSubmitting(true);
    setImageMismatch(null);

    try {
      const duplicateCheckPayload = {
        complaint_text: form.complaint_text,
        latitude: form.latitude,
        longitude: form.longitude,
        ward_id: form.ward_id,
        district_name: form.district_name,
      };

      const { data } = await api.post(
        ENDPOINTS.GRIEVANCES.DUPLICATE_CHECK,
        duplicateCheckPayload
      );

      if (data?.warning && Array.isArray(data.possibleDuplicates) && data.possibleDuplicates.length) {
        setPossibleDuplicates(data.possibleDuplicates);
        setShowDuplicatePrompt(true);
        return;
      }

      await submitComplaint();
    } catch (err) {
      if (!err.response && !navigator.onLine) {
        await queueComplaintOffline();
        return;
      }

      onError?.(err.response?.data?.message || "Failed to validate complaint before submit");
    } finally {
      setSubmitting(false);
    }
  };

  const buildFormData = () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) =>
      formData.append(key, value)
    );
    formData.append("image", image);
    return formData;
  };

  const resetForm = () => {
    setForm({
      district_name: "",
      ward_id: "",
      complaint_text: "",
      latitude: "",
      longitude: "",
    });
    setImage(null);
    setPossibleDuplicates([]);
    setShowDuplicatePrompt(false);
  };

  const queueComplaintOffline = async () => {
    const queued = await enqueueComplaint({
      form,
      imageFile: image,
    });

    const queueCount = getOfflineComplaintQueueCount();
    onSuccess?.({
      queuedOffline: true,
      queueId: queued.id,
      queueCount,
    });
    resetForm();
  };

  const submitComplaint = async () => {
    if (!navigator.onLine) {
      await queueComplaintOffline();
      return;
    }

    try {
      const { data } = await api.post(ENDPOINTS.GRIEVANCES.CREATE, buildFormData(), {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSuccess?.(data);
      resetForm();
    } catch (err) {
      if (!err.response) {
        await queueComplaintOffline();
        return;
      }

      const resData = err.response?.data;

      if (resData?.message === "Image does not match complaint" && resData?.reason) {
        setImageMismatch(resData.reason);
      } else {
        onError?.(resData?.message || "Failed to submit grievance");
      }
    }
  };

  const handleSubmitAnyway = async () => {
    setSubmitting(true);
    setImageMismatch(null);

    try {
      await submitComplaint();
    } catch (err) {
      onError?.(err.response?.data?.message || "Failed to submit grievance");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grievance-form" onSubmit={handleSubmit}>
      <div className="ai-notice">
        <span className="ai-notice-icon">🤖</span>
        <span>{t("aiAutoDetect", { defaultValue: "Category, severity, and summary will be auto-detected by AI from your complaint text." })}</span>
      </div>

      {voiceSupported && (
        <div className="voice-banner">
          <span className="voice-banner-icon">🎙️</span>
          <span>{t("voiceHelp")}</span>
        </div>
      )}

      {voiceSupported && (
        <div className="voice-language-picker" role="group" aria-label="Voice language mode">
          {VOICE_LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              className={`voice-language-btn ${voiceLanguage === item.code ? "active" : ""}`}
              onClick={() => setVoiceLanguage(item.code)}
              disabled={submitting || listening}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

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
          <label>{t("districtLabel")}</label>
          <input
            name="district_name"
            value={form.district_name}
            onChange={handleChange}
            placeholder={t("district", { defaultValue: "District" })}
            required
          />
        </div>

        <div className="form-group">
          <label>{t("wardIdLabel")}</label>
          <input
            name="ward_id"
            value={form.ward_id}
            onChange={handleChange}
            placeholder={t("wardIdLabel")}
            required
          />
        </div>

        <div className="form-group">
          <label>{t("latitudeLabel")}</label>
          <input
            name="latitude"
            value={form.latitude}
            onChange={handleChange}
            placeholder={t("latitudeLabel")}
            required
            type="number"
            step="any"
          />
        </div>

        <div className="form-group">
          <label>{t("longitudeLabel")}</label>
          <input
            name="longitude"
            value={form.longitude}
            onChange={handleChange}
            placeholder={t("longitudeLabel")}
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
        {gettingLocation ? t("gettingLocation") : `📍 ${t("useMyLocation")}`}
      </button>

      <div className="form-group">
        <label>{t("complaintDetailsLabel")}</label>
        <div className="voice-input-wrap voice-textarea-wrap">
          <textarea
            name="complaint_text"
            value={form.complaint_text}
            onChange={handleChange}
            placeholder={t("describeComplaint")}
            required
            rows={4}
          />
          {voiceSupported && (
            <button
              type="button"
              className={`voice-mic-btn voice-mic-textarea ${listening && activeVoiceField === "complaint_text" ? "voice-active" : ""}`}
              onClick={() => toggleVoice("complaint_text")}
              title={t("speakComplaint", { defaultValue: "Speak your complaint" })}
            >
              {listening && activeVoiceField === "complaint_text" ? "⏹" : "🎤"}
            </button>
          )}
        </div>
        {listening && activeVoiceField === "complaint_text" && (
          <div className="voice-listening-bar">
            <span className="voice-pulse" />
            <span className="voice-listening-text">{t("listeningNow", { defaultValue: "Listening... speak now" })}</span>
          </div>
        )}
        {listening && activeVoiceField === "complaint_text" && interim && (
          <p className="voice-interim">{interim}</p>
        )}
      </div>

      <div className="form-group">
        <label>{t("uploadImage")}</label>
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
        {submitting ? t("submitting", { defaultValue: "Submitting..." }) : t("submitComplaint")}
      </button>

      <Modal
        isOpen={showDuplicatePrompt}
        onClose={() => setShowDuplicatePrompt(false)}
        title={t("duplicateTitle")}
      >
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <p style={{ margin: 0 }}>
            {t("duplicateHint")}
          </p>
          <div style={{ maxHeight: "240px", overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "0.5rem" }}>
            {possibleDuplicates.map((item) => (
              <div key={item._id} style={{ borderBottom: "1px solid #f1f5f9", padding: "0.5rem 0" }}>
                <strong>{item.grievance_id}</strong>
                <div style={{ fontSize: "0.85rem", color: "#475569" }}>
                  {t("similarity", { defaultValue: "Similarity" })}: {Math.round((item.similarity || 0) * 100)}%{" "}
                  {typeof item.distanceMeters === "number" ? `- ${item.distanceMeters}m away` : ""}
                </div>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem" }}>{item.complaint_text}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowDuplicatePrompt(false)}
            >
              {t("editComplaint")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmitAnyway}
              disabled={submitting}
            >
              {submitting ? t("submitting", { defaultValue: "Submitting..." }) : t("submitAnyway")}
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
};

export default GrievanceForm;
