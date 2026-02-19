import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import useAuth from "../hooks/useAuth";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";
import Toast from "../components/common/Toast";
import AssetForm from "../components/forms/AssetForm";
import AssetEditModal from "../components/forms/AssetEditModal";
import AssetCreateModal from "../components/forms/AssetCreateModal";
import MapContainer from "../components/map/MapContainer";
import AssetMarkers from "../components/map/AssetMarkers";
import { formatDate, formatCurrency } from "../utils/formatters";

const PAGE_SIZE = 10;

const Assets = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";

  const [assets, setAssets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [editAsset, setEditAsset] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(ENDPOINTS.ASSETS.LIST, {
        params: { page, limit: PAGE_SIZE },
      });
      setAssets(data.assets || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Derived: unique asset types for filter
  const assetTypes = [...new Set(assets.map((a) => a.asset_type))].sort();

  // Client-side filtering on the current page
  const filtered = assets.filter((a) => {
    const matchesSearch =
      !search ||
      a.asset_id?.toLowerCase().includes(search.toLowerCase()) ||
      a.district_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.ward_id?.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || a.asset_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleEdit = (asset) => {
    setEditAsset(asset);
  };

  const handleSave = async (updates) => {
    if (!editAsset) return;
    setSaving(true);
    try {
      const { data } = await api.put(
        ENDPOINTS.ASSETS.UPDATE(editAsset._id),
        updates
      );
      // Update local state
      setAssets((prev) =>
        prev.map((a) => (a._id === editAsset._id ? data.asset : a))
      );
      setEditAsset(null);
      setToast({ message: "Asset updated successfully", type: "success" });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to update asset",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (newAsset) => {
    setSaving(true);
    try {
      await api.post(ENDPOINTS.ASSETS.CREATE, newAsset);
      setShowCreate(false);
      setPage(1);
      await fetchAssets();
      setToast({ message: "Asset created successfully", type: "success" });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Failed to create asset",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && assets.length === 0) return <Loader text="Loading assets..." />;
  return (
    <div className="assets-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="page-header">
        <div>
          <h2>Infrastructure Assets</h2>
          <p className="text-muted">
            {total} total assets {isAdmin && "• Admin View"}
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => setShowCreate(true)}
          >
            + Add Asset
          </button>
        )}
      </div>

      {/* Map */}
      <div
        className="map-wrapper"
        style={{ height: "350px", marginBottom: "1.5rem" }}
      >
        <MapContainer>
          <AssetMarkers assets={filtered} />
        </MapContainer>
      </div>

      {/* Filters */}
      <div className="assets-toolbar">
        <input
          type="text"
          className="assets-search"
          placeholder="Search by ID, district, or ward..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {assetTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Table */}
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
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="text-center">
                  No assets found
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a._id}
                  className="table-row-clickable"
                  onClick={() => setSelectedAsset(a)}
                >
                  <td>{a.asset_id}</td>
                  <td>
                    <span className="asset-type-badge">{a.asset_type}</span>
                  </td>
                  <td>{a.district_name}</td>
                  <td>{a.ward_id}</td>
                  <td>{formatDate(a.last_maintenance_date)}</td>
                  <td>{formatCurrency(a.estimated_repair_cost)}</td>
                  <td>{a.service_radius}m</td>
                  {isAdmin && (
                    <td>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(a);
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-sm btn-outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-sm btn-outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* View Detail Modal */}
      <Modal
        isOpen={!!selectedAsset && !editAsset}
        onClose={() => setSelectedAsset(null)}
        title="Asset Details"
      >
        <AssetForm asset={selectedAsset} />
        {isAdmin && selectedAsset && (
          <div className="form-actions" style={{ marginTop: "1rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditAsset(selectedAsset);
                setSelectedAsset(null);
              }}
            >
              Edit Asset
            </button>
          </div>
        )}
      </Modal>

      {/* Edit Modal (Admin) */}
      <Modal
        isOpen={!!editAsset}
        onClose={() => setEditAsset(null)}
        title="Edit Asset"
      >
        <AssetEditModal
          asset={editAsset}
          onSave={handleSave}
          onCancel={() => setEditAsset(null)}
          saving={saving}
        />
      </Modal>
      {/* Create Modal (Admin) */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Asset"
        size="lg"
      >
        <AssetCreateModal
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          saving={saving}
        />
      </Modal>
    </div>
  );
};

export default Assets;
