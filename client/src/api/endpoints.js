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
    SEND_ALERT: "/dashboard/send-alert",
    WARD_SCORECARDS: "/dashboard/wards/scorecards",
    WARD_COMPARISON: "/dashboard/wards/comparison",
    WARD_SCORECARD: (wardId) => `/dashboard/ward/${encodeURIComponent(wardId)}/scorecard`,
  },
  SLA: {
    RULES: "/sla/rules",
    RULE_BY_ID: (id) => `/sla/rules/${id}`,
    ESCALATION_RULES: "/sla/escalation-rules",
    BREACHED_GRIEVANCES: "/sla/breached-grievances",
    ESCALATION_SUMMARY: "/sla/escalations/summary",
    GRIEVANCE_ESCALATIONS: (id) => `/sla/grievance/${id}/escalations`,
    UPDATE_GRIEVANCE_STATUS: (id) => `/sla/grievance/${id}/update-status`,
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
  PUBLIC: {
    TRACK: (grievanceId) => `/public/track/${encodeURIComponent(grievanceId)}`,
    FEEDBACK: "/public/feedback",
  },
};

export default ENDPOINTS;
