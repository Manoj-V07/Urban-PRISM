import {
  CATEGORIES,
  SEVERITY_LEVELS,
  GRIEVANCE_STATUSES,
} from "../../utils/constants";

const Filters = ({ filters, onChange, onReset }) => {
  const handleChange = (key, value) => {
    onChange(key, value);
  };

  return (
    <div className="filters-bar">
      <select
        value={filters.category || ""}
        onChange={(e) => handleChange("category", e.target.value)}
        className="filter-select"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      <select
        value={filters.severity || ""}
        onChange={(e) => handleChange("severity", e.target.value)}
        className="filter-select"
      >
        <option value="">All Severities</option>
        {SEVERITY_LEVELS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filters.status || ""}
        onChange={(e) => handleChange("status", e.target.value)}
        className="filter-select"
      >
        <option value="">All Statuses</option>
        {GRIEVANCE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <button className="btn btn-outline btn-sm" onClick={onReset}>
        Reset
      </button>
    </div>
  );
};

export default Filters;
