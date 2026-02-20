import { useState, useMemo } from "react";
import useFetch from "../hooks/useFetch";
import ENDPOINTS from "../api/endpoints";
import MapContainer from "../components/map/MapContainer";
import FitBounds from "../components/map/FitBounds";
import HeatmapLayer from "../components/map/HeatmapLayer";
import ClusterMarkers from "../components/map/ClusterMarkers";
import AssetMarkers from "../components/map/AssetMarkers";
import Loader from "../components/common/Loader";

const MapView = () => {
  const { data: clusters, loading: loadingClusters } = useFetch(
    ENDPOINTS.CLUSTERS.LIST
  );
  const { data: topRisks } = useFetch(ENDPOINTS.DASHBOARD.TOP_RISKS);
  const [layer, setLayer] = useState("heatmap");

  // All hooks must be called before any early returns
  const clusterList = useMemo(() => {
    return Array.isArray(clusters) ? clusters : [];
  }, [clusters]);

  const assets = useMemo(() => {
    const assetsMap = new Map();
    clusterList.forEach((c) => {
      if (c.asset_ref && !assetsMap.has(c.asset_ref._id)) {
        assetsMap.set(c.asset_ref._id, c.asset_ref);
      }
    });
    return Array.from(assetsMap.values());
  }, [clusterList]);

  const bounds = useMemo(() => {
    const coords = clusterList
      .filter((c) => c?.location?.coordinates)
      .map((c) => [c.location.coordinates[1], c.location.coordinates[0]]);
    
    return coords.length >= 2 ? coords : null;
  }, [clusterList]);

  if (loadingClusters) return <Loader text="Loading map data..." />;

  return (
    <div className="map-page">
      <div className="page-header">
        <h2>Risk Map</h2>
        <div className="map-controls">
          <button
            className={`btn btn-sm ${layer === "heatmap" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setLayer("heatmap")}
          >
            Heatmap
          </button>
          <button
            className={`btn btn-sm ${layer === "markers" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setLayer("markers")}
          >
            Markers
          </button>
          <button
            className={`btn btn-sm ${layer === "assets" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setLayer("assets")}
          >
            Assets
          </button>
          <button
            className={`btn btn-sm ${layer === "all" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setLayer("all")}
          >
            All
          </button>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer>
          {bounds && <FitBounds bounds={bounds} />}
          {(layer === "heatmap" || layer === "all") && (
            <HeatmapLayer clusters={clusterList} riskScores={topRisks} />
          )}
          {(layer === "markers" || layer === "all") && (
            <ClusterMarkers clusters={clusterList} />
          )}
          {(layer === "assets" || layer === "all") && (
            <AssetMarkers assets={assets} />
          )}
        </MapContainer>
      </div>

      <div className="map-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: "#22c55e" }}
            />
            Low Risk
          </div>
          <div className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: "#f59e0b" }}
            />
            Medium Risk
          </div>
          <div className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: "#f97316" }}
            />
            High Risk
          </div>
          <div className="legend-item">
            <span
              className="legend-dot"
              style={{ backgroundColor: "#ef4444" }}
            />
            Critical Risk
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
