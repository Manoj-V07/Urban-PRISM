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
    CREATE: "/assets",
    UPDATE: (id) => `/assets/${id}`,
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
  FIELD_WORKERS: {
    LIST: "/field-workers",
    ELIGIBLE: "/field-workers/eligible",
    VERIFY: (id) => `/field-workers/${id}/verify`,
    REJECT: (id) => `/field-workers/${id}/reject`,
    UPDATE_LOCATION: "/field-workers/location",
  },
  TASKS: {
    ASSIGN: "/task-assignments",
    LIST: "/task-assignments",
    MY: "/task-assignments/my",
    START: (id) => `/task-assignments/${id}/start`,
    COMPLETE: (id) => `/task-assignments/${id}/complete`,
    VERIFY: (id) => `/task-assignments/${id}/verify`,
    REJECT: (id) => `/task-assignments/${id}/reject`,
  },
};

export default ENDPOINTS;
