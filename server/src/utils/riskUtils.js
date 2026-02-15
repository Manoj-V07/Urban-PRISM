export const normalize = (value, min, max) => {
  if (max === min) return 0;
  return (value - min) / (max - min);
};

export const severityMap = {
  Low: 0.3,
  Medium: 0.6,
  High: 1
};
