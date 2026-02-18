import { useState } from "react";
import useFetch from "../hooks/useFetch";
import ENDPOINTS from "../api/endpoints";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";
import AssetForm from "../components/forms/AssetForm";
import MapContainer from "../components/map/MapContainer";
import AssetMarkers from "../components/map/AssetMarkers";
import { formatDate, formatCurrency } from "../utils/formatters";

const Assets = () => {
  const { data: assets = [], loading, error } = useFetch(ENDPOINTS.ASSETS.LIST);
  const [selectedAsset, setSelectedAsset] = useState(null);

  if (loading) return <Loader text="Loading assets..." />;

  return (
    <div className="assets-page">
      <div className="page-header">
        <h2>Infrastructure Assets</h2>
        <p className="text-muted">
          {assets.length} assets available
        </p>
      </div>

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
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center">
                  No assets found
                </td>
              </tr>
            ) : (
              assets.map((a) => (
                <tr
                  key={a._id}
                  onClick={() => setSelectedAsset(a)}
                  className="table-row-clickable"
                >
                  <td>{a.asset_id}</td>
                  <td>{a.asset_type}</td>
                  <td>{a.district_name}</td>
                  <td>{a.ward_id}</td>
                  <td>{formatDate(a.last_maintenance_date)}</td>
                  <td>{formatCurrency(a.estimated_repair_cost)}</td>
                  <td>{a.service_radius}m</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title="Asset Details"
      >
        <AssetForm asset={selectedAsset} />
      </Modal>
    </div>
  );
};

export default Assets;
