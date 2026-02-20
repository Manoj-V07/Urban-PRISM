import { useState } from "react";
import useFetch from "../hooks/useFetch";
import ENDPOINTS from "../api/endpoints";
import api from "../api/axios";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";
import AssetForm from "../components/forms/AssetForm";
import MapContainer from "../components/map/MapContainer";
import AssetMarkers from "../components/map/AssetMarkers";
import { formatDate, formatCurrency } from "../utils/formatters";

const Assets = () => {
  const {
    data: assetsData,
    loading,
    error,
    refetch,
  } = useFetch(ENDPOINTS.ASSETS.LIST);

  const assets = Array.isArray(assetsData)
    ? assetsData
    : Array.isArray(assetsData?.data)
      ? assetsData.data
      : Array.isArray(assetsData?.assets)
        ? assetsData.assets
      : [];

  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const openAddModal = () => {
    setSuccessMessage(null);
    setFormError(null);
    setSelectedAsset(null);
    setModalMode("add");
  };

  const openEditModal = (asset) => {
    setSuccessMessage(null);
    setFormError(null);
    setSelectedAsset(asset);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedAsset(null);
    setFormError(null);
  };

  const handleAssetSubmit = async (payload) => {
    setSubmitting(true);
    setFormError(null);

    try {
      if (modalMode === "add") {
        await api.post(ENDPOINTS.ASSETS.CREATE, payload);
        setSuccessMessage("Asset added successfully");
      } else if (selectedAsset?._id) {
        await api.patch(ENDPOINTS.ASSETS.UPDATE(selectedAsset._id), payload);
        setSuccessMessage("Asset updated successfully");
      }

      await refetch();
      closeModal();
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to save asset");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader text="Loading assets..." />;

  return (
    <div className="assets-page">
      <div className="page-header">
        <h2>Infrastructure Assets</h2>
        <div className="page-actions">
          <p className="text-muted">{assets.length} assets available</p>
          <button className="btn btn-primary" onClick={openAddModal}>
            Add Asset
          </button>
        </div>
      </div>

      {successMessage && <p className="alert alert-success">{successMessage}</p>}

      {error && (
        <p className="text-danger" style={{ marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      <div
        className="map-wrapper"
        style={{ height: "350px", marginBottom: "1.5rem" }}
      >
        <MapContainer>
          <AssetMarkers assets={assets} />
        </MapContainer>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Type</th>
              <th>District</th>
              <th>Ward</th>
              <th>Last Maintenance</th>
              <th>Repair Cost</th>
              <th>Radius</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center">
                  No assets found
                </td>
              </tr>
            ) : (
              assets.map((a) => (
                <tr key={a._id} className="table-row-clickable">
                  <td>{a.asset_id}</td>
                  <td>{a.asset_type}</td>
                  <td>{a.district_name}</td>
                  <td>{a.ward_id}</td>
                  <td>{formatDate(a.last_maintenance_date)}</td>
                  <td>{formatCurrency(a.estimated_repair_cost)}</td>
                  <td>{a.service_radius}m</td>
                  <td>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => openEditModal(a)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!modalMode}
        onClose={closeModal}
        title={modalMode === "add" ? "Add Asset" : "Edit Asset"}
      >
        <AssetForm
          asset={selectedAsset}
          onSubmit={handleAssetSubmit}
          onCancel={closeModal}
          loading={submitting}
          error={formError}
          submitLabel={modalMode === "add" ? "Add Asset" : "Save Changes"}
        />
      </Modal>
    </div>
  );
};

export default Assets;
