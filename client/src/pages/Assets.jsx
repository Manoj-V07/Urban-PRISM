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
  const { data: clusters, loading } = useFetch(ENDPOINTS.CLUSTERS.LIST);
  const [selectedAsset, setSelectedAsset] = useState(null);

  if (loading) return <Loader text="Loading assets..." />;

  // Extract unique assets from clusters
  const assetsMap = new Map();
  clusters?.forEach((c) => {
    if (c.asset_ref && !assetsMap.has(c.asset_ref._id)) {
      assetsMap.set(c.asset_ref._id, c.asset_ref);
    }
  });
  const assets = Array.from(assetsMap.values());

  return (
    <div className="assets-page">
      <div className="page-header">
        <h2>Infrastructure Assets</h2>
        <p className="text-muted">
          {assets.length} assets linked to clusters
        </p>
      </div>

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
