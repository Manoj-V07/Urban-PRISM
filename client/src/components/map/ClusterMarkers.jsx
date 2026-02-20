import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { formatDate } from "../../utils/formatters";

const defaultClusterIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const ClusterMarkers = ({ clusters }) => {
  if (!clusters?.length) return null;

  const uniqueClusters = [];
  const seenIds = new Set();

  clusters.forEach((cluster) => {
    const id = String(cluster?._id || "");
    if (!id || seenIds.has(id)) return;
    seenIds.add(id);
    uniqueClusters.push(cluster);
  });

  return (
    <>
      {uniqueClusters.map((cluster) => {
        if (!cluster?.location?.coordinates) return null;

        return (
          <Marker
            key={cluster._id}
            position={[
              cluster.location.coordinates[1],
              cluster.location.coordinates[0],
            ]}
            icon={defaultClusterIcon}
          >
            <Popup>
              <div className="marker-popup">
                <strong>{cluster.category}</strong>
                <p>Ward: {cluster.ward_id}</p>
                <p>District: {cluster.district_name}</p>
                <p>Complaints: {cluster.complaint_volume}</p>
                <p>Status: {cluster.status}</p>
                <p>Date: {formatDate(cluster.createdAt)}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default ClusterMarkers;
