const ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
  },
  USERS: {
    PROFILE: "/users/profile",
    ADMIN: "/users/admin",
  },
  GRIEVANCES: {
    CREATE: "/grievances",
    MY: "/grievances/my",
    UPDATE_STATUS: (id) => `/grievances/${id}/status`,
  },
  CLUSTERS: {
    LIST: "/clusters",
  },
  ASSETS: {
    LIST: "/assets",
  },
  RISK: {
    RUN: "/risk/run",
  },
  DASHBOARD: {
    TOP_RISKS: "/dashboard/top",
    SUMMARY: "/dashboard/summary",
    RISK_TREND: "/dashboard/risk-trend",
    COMPLAINTS: "/dashboard/complaints",
  },
  AI: {
    ANALYZE: "/ai/analyze",
    TRANSLATE: "/ai/translate",
    CHAT: "/ai/chat",
  },
};

export default ENDPOINTS;
