import { createContext, useState } from "react";
import api from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import {
  setToken,
  removeToken,
  getUser,
  setUser,
  removeUser,
} from "../utils/helpers";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(getUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auth interceptor is set up at module level in api/axios.js
  // to avoid race conditions with child useEffect hooks.

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      setToken(data.token);
      setUser(data);
      setUserState(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, role = "Citizen", workerCategory = null) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { name, email, password, role };
      if (role === "FieldWorker" && workerCategory) {
        payload.workerCategory = workerCategory;
      }
      const { data } = await api.post(ENDPOINTS.AUTH.REGISTER, payload);

      // Field workers are not auto-verified, don't log them in fully
      if (data.role === "FieldWorker" && !data.isVerified) {
        return data; // caller can show "pending verification" message
      }

      setToken(data.token);
      setUser(data);
      setUserState(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    removeUser();
    setUserState(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
