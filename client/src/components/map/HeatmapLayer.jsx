import { CircleMarker, Popup } from "react-leaflet";
import { getRiskLevel } from "../../utils/helpers";

const HeatmapLayer = ({ clusters, riskScores }) => {
  if (!clusters?.length) return null;

  const getClusterScore = (clusterId) => {
    const risk = riskScores?.find(
      (r) => r.cluster?._id === clusterId || r.cluster === clusterId
    );
    return risk?.score || 0;
  };

  return (
    <>
      {clusters.map((cluster) => {
        if (!cluster?.location?.coordinates) return null;
        const score = getClusterScore(cluster._id);
        const level = getRiskLevel(score);
        const radius = Math.max(
          15,
          Math.min(50, cluster.complaint_volume * 5)
        );

        return (
          <CircleMarker
            key={cluster._id}
            center={[
              cluster.location.coordinates[1],
              cluster.location.coordinates[0],
            ]}
            radius={radius}
            fillColor={level.color}
            color={level.color}
            weight={2}
            opacity={0.8}
            fillOpacity={0.4}
          >
            <Popup>
              <div className="marker-popup">
                <strong>{cluster.category}</strong>
                <p>Ward: {cluster.ward_id}</p>
                <p>Complaints: {cluster.complaint_volume}</p>
                <p>
                  Risk:{" "}
                  <span style={{ color: level.color }}>
                    {score} ({level.label})
                  </span>
                </p>
                <p>Status: {cluster.status}</p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};

export default HeatmapLayer;
