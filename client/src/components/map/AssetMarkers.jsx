import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { formatDate, formatCurrency } from "../../utils/formatters";

const assetIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const AssetMarkers = ({ assets }) => {
  if (!assets?.length) return null;

  return (
    <>
      {assets.map((asset) => (
        <Marker
          key={asset._id}
          position={[
            asset.location.coordinates[1],
            asset.location.coordinates[0],
          ]}
          icon={assetIcon}
        >
          <Popup>
            <div className="marker-popup">
              <strong>{asset.asset_type}</strong>
              <p>ID: {asset.asset_id}</p>
              <p>District: {asset.district_name}</p>
              <p>Ward: {asset.ward_id}</p>
              <p>
                Last Maintenance: {formatDate(asset.last_maintenance_date)}
              </p>
              <p>
                Repair Cost:{" "}
                {formatCurrency(asset.estimated_repair_cost)}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default AssetMarkers;
