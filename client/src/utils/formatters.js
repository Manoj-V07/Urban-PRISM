export const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatRiskScore = (score) => {
  if (score === null || score === undefined) return "N/A";
  return Math.round(score);
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
};
