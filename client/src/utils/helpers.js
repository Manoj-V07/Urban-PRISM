export const getToken = () => localStorage.getItem("token");
export const setToken = (token) => localStorage.setItem("token", token);
export const removeToken = () => localStorage.removeItem("token");

export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const setUser = (user) =>
  localStorage.setItem("user", JSON.stringify(user));

export const removeUser = () => localStorage.removeItem("user");

export const isAdmin = (user) => user?.role === "Admin";
export const isCitizen = (user) => user?.role === "Citizen";

export const getRiskLevel = (score) => {
  if (score >= 70) return { label: "Critical", color: "#ef4444" };
  if (score >= 50) return { label: "High", color: "#f97316" };
  if (score >= 30) return { label: "Medium", color: "#f59e0b" };
  return { label: "Low", color: "#22c55e" };
};

export const classNames = (...classes) => classes.filter(Boolean).join(" ");
