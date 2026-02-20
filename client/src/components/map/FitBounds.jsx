import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

const FitBounds = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (!bounds || bounds.length < 2) return;
    
    const leafletBounds = L.latLngBounds(
      bounds.map(([lat, lng]) => [lat, lng])
    );

    map.fitBounds(leafletBounds, { padding: [50, 50], maxZoom: 13 });
  }, [map, bounds]);

  return null;
};

export default FitBounds;
