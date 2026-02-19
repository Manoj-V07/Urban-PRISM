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
    BY_ID: (id) => `/assets/${id}`,
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
  TASKS: {
    LIST: "/tasks",
    ASSIGN: "/tasks",
    MY: "/tasks/my",
    START: (id) => `/tasks/${id}/start`,
    SUBMIT_PROOF: (id) => `/tasks/${id}/proof`,
    APPROVE: (id) => `/tasks/${id}/approve`,
    REJECT: (id) => `/tasks/${id}/reject`,
    WORKERS: "/tasks/workers",
    VERIFIED_WORKERS: "/tasks/workers/verified",
    VERIFY_WORKER: (id) => `/tasks/workers/${id}/verify`,
    REVOKE_WORKER: (id) => `/tasks/workers/${id}/revoke`,
  },
};

export default ENDPOINTS;
