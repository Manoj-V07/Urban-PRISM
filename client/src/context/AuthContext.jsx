import { createContext, useState, useEffect } from "react";
import api from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import {
  getToken,
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

  useEffect(() => {
    const interceptor = api.interceptors.request.use((config) => {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return () => api.interceptors.request.eject(interceptor);
  }, []);

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

  const register = async (name, email, password, role = "Citizen") => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(ENDPOINTS.AUTH.REGISTER, {
        name,
        email,
        password,
        role,
      });
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
