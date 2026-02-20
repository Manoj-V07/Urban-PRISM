import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { SEVERITY_COLORS } from "../../utils/constants";
import { formatDate } from "../../utils/formatters";

const getGrievanceIcon = (severity) => {
  const color =
    severity === "High" ? "red" : severity === "Medium" ? "orange" : "green";
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

const GrievanceMarkers = ({ grievances }) => {
  if (!grievances?.length) return null;

  const uniqueGrievances = [];
  const seenIds = new Set();

  grievances.forEach((grievance) => {
    const id = String(grievance?._id || "");
    if (!id || seenIds.has(id)) return;
    seenIds.add(id);
    uniqueGrievances.push(grievance);
  });

  return (
    <>
      {uniqueGrievances.map((g) => {
        if (!g?.location?.coordinates) return null;
        return (
          <Marker
            key={`${g._id}-${g.grievance_id || "marker"}`}
            position={[
              g.location.coordinates[1],
              g.location.coordinates[0],
            ]}
            icon={getGrievanceIcon(g.severity_level)}
          >
            <Popup>
              <div className="marker-popup">
                <strong>{g.category}</strong>
                <p>{g.complaint_text?.slice(0, 100)}</p>
                <p>
                  Severity:{" "}
                  <span
                    style={{
                      color: SEVERITY_COLORS[g.severity_level],
                    }}
                  >
                    {g.severity_level}
                  </span>
                </p>
                <p>Status: {g.status}</p>
                <p>Date: {formatDate(g.complaint_date)}</p>
                <p>Ward: {g.ward_id}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default GrievanceMarkers;
