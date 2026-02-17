import { MapContainer as LeafletMap, TileLayer } from "react-leaflet";
import { MAP_CENTER, MAP_ZOOM } from "../../utils/constants";
import "leaflet/dist/leaflet.css";

const MapContainer = ({
  children,
  center = MAP_CENTER,
  zoom = MAP_ZOOM,
  style,
}) => {
  return (
    <LeafletMap
      center={center}
      zoom={zoom}
      style={{
        height: "100%",
        width: "100%",
        borderRadius: "8px",
        ...style,
      }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {children}
    </LeafletMap>
  );
};

export default MapContainer;
