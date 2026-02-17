import { useState, useCallback } from "react";
import { MAP_CENTER, MAP_ZOOM } from "../utils/constants";

const useMap = () => {
  const [center, setCenter] = useState(MAP_CENTER);
  const [zoom, setZoom] = useState(MAP_ZOOM);
  const [selectedMarker, setSelectedMarker] = useState(null);

  const flyTo = useCallback((coords, zoomLevel = 15) => {
    setCenter(coords);
    setZoom(zoomLevel);
  }, []);

  const resetView = useCallback(() => {
    setCenter(MAP_CENTER);
    setZoom(MAP_ZOOM);
    setSelectedMarker(null);
  }, []);

  return {
    center,
    zoom,
    selectedMarker,
    setSelectedMarker,
    flyTo,
    resetView,
  };
};

export default useMap;
