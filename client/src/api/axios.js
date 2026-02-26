import axios from "axios";
import { getToken } from "../utils/helpers";

const LOCAL_API_ORIGIN = "http://localhost:5000";
const DEPLOYED_API_ORIGIN = "https://urban-prism.onrender.com";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const configuredApiOrigin = import.meta.env.VITE_API_URL;
const isLocalhost =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const API_ORIGIN =
  configuredApiOrigin || (isLocalhost ? LOCAL_API_ORIGIN : DEPLOYED_API_ORIGIN);
export const API_BASE_URL = configuredApiBaseUrl || `${API_ORIGIN}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
