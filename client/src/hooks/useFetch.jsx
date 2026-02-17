import { useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { immediate = true } = options;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await api.get(url);
      setData(response);
      return response;
    } catch (err) {
      const msg = err.response?.data?.message || "Fetch failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate && url) fetchData();
  }, [fetchData, immediate, url]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;
