import { useMemo, useState } from "react";
import api from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import useFetch from "../hooks/useFetch";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal";
import Toast from "../components/common/Toast";

const STATUS_STYLE = {
  "On Track": { background: "#dcfce7", color: "#166534" },
  "At Risk": { background: "#fef3c7", color: "#92400e" },
  Breached: { background: "#fee2e2", color: "#991b1b" },
};

const initialSlaForm = {
  rule_name: "",
  severity_level: "High",
  category: "",
  response_hours: 24,
};

const initialEscalationForm = {
  rule_name: "",
  breach_hours_threshold: 2,
  priority: 10,
};

const toDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const toPercent = (value) => Number(value || 0).toFixed(1);

const SLAControlCenter = () => {
  const {
    data: slaRules,
    loading: loadingSlaRules,
    refetch: refetchSlaRules,
  } = useFetch(ENDPOINTS.SLA.RULES);
  const {
    data: escalationRules,
    loading: loadingEscalationRules,
    refetch: refetchEscalationRules,
  } = useFetch(ENDPOINTS.SLA.ESCALATION_RULES);
  const {
    data: breached,
    loading: loadingBreached,
    refetch: refetchBreached,
  } = useFetch(ENDPOINTS.SLA.BREACHED_GRIEVANCES);
  const {
    data: escalationSummary,
    loading: loadingEscalationSummary,
    refetch: refetchEscalationSummary,
  } = useFetch(ENDPOINTS.SLA.ESCALATION_SUMMARY);
  const {
    data: wardScorecards,
    loading: loadingScorecards,
    refetch: refetchScorecards,
  } = useFetch(ENDPOINTS.DASHBOARD.WARD_SCORECARDS);
  const { data: wardComparison, loading: loadingComparison } = useFetch(
    ENDPOINTS.DASHBOARD.WARD_COMPARISON
  );

  const [slaForm, setSlaForm] = useState(initialSlaForm);
  const [escalationForm, setEscalationForm] = useState(initialEscalationForm);
  const [creatingSlaRule, setCreatingSlaRule] = useState(false);
  const [creatingEscRule, setCreatingEscRule] = useState(false);
  const [selectedWard, setSelectedWard] = useState("");
  const [selectedWardScorecard, setSelectedWardScorecard] = useState(null);
  const [loadingWardScorecard, setLoadingWardScorecard] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [loadingEscalationHistory, setLoadingEscalationHistory] = useState(false);
  const [escalationHistory, setEscalationHistory] = useState([]);
  const [toast, setToast] = useState(null);

  const breaches = breached?.grievances || [];

  const wardIds = useMemo(
    () => (wardScorecards?.scorecards || []).map((card) => card.ward_id),
    [wardScorecards]
  );

  const allWardAnalytics = useMemo(() => {
    const cards = wardScorecards?.scorecards || [];
    const totalGrievances = cards.reduce(
      (sum, card) => sum + (card.summary?.total_grievances || 0),
      0
    );
    const totalResolved = cards.reduce(
      (sum, card) => sum + (card.summary?.resolved || 0),
      0
    );
    const totalBreached = cards.reduce(
      (sum, card) => sum + (card.sla_metrics?.breached || 0),
      0
    );

    const gradeDistribution = cards.reduce((acc, card) => {
      const grade = card.performance_grade?.grade || "N/A";
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});

    const sortedByResolution = [...cards].sort(
      (a, b) => (b.summary?.resolution_rate || 0) - (a.summary?.resolution_rate || 0)
    );

    const sortedByCompliance = [...cards].sort(
      (a, b) =>
        (b.sla_metrics?.sla_compliance_rate || 0) -
        (a.sla_metrics?.sla_compliance_rate || 0)
    );

    return {
      totalGrievances,
      totalResolved,
      totalBreached,
      gradeDistribution,
      topResolutionWard: sortedByResolution[0] || null,
      lowestResolutionWard: sortedByResolution[sortedByResolution.length - 1] || null,
      topComplianceWard: sortedByCompliance[0] || null,
      resolutionRanking: sortedByResolution.slice(0, 6),
    };
  }, [wardScorecards]);

  const loadingAny =
    loadingSlaRules ||
    loadingEscalationRules ||
    loadingBreached ||
    loadingEscalationSummary ||
    loadingScorecards ||
    loadingComparison;

  const refreshAll = async () => {
    await Promise.all([
      refetchSlaRules(),
      refetchEscalationRules(),
      refetchBreached(),
      refetchEscalationSummary(),
      refetchScorecards(),
    ]);
  };

  const handleCreateSlaRule = async (event) => {
    event.preventDefault();
    setCreatingSlaRule(true);

    try {
      await api.post(ENDPOINTS.SLA.RULES, {
        ...slaForm,
        category: slaForm.category?.trim() || null,
        response_hours: Number(slaForm.response_hours),
      });
      setSlaForm(initialSlaForm);
      setToast({ message: "SLA rule created", type: "success" });
      refetchSlaRules();
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Failed to create SLA rule",
        type: "error",
      });
    } finally {
      setCreatingSlaRule(false);
    }
  };

  const handleDeactivateSlaRule = async (ruleId) => {
    try {
      await api.delete(ENDPOINTS.SLA.RULE_BY_ID(ruleId));
      setToast({ message: "SLA rule deactivated", type: "success" });
      refetchSlaRules();
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Failed to deactivate rule",
        type: "error",
      });
    }
  };

  const handleCreateEscalationRule = async (event) => {
    event.preventDefault();
    setCreatingEscRule(true);

    try {
      await api.post(ENDPOINTS.SLA.ESCALATION_RULES, {
        ...escalationForm,
        breach_hours_threshold: Number(escalationForm.breach_hours_threshold),
        priority: Number(escalationForm.priority),
        escalate_to_roles: ["Admin"],
      });
      setEscalationForm(initialEscalationForm);
      setToast({ message: "Escalation rule created", type: "success" });
      refetchEscalationRules();
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Failed to create escalation rule",
        type: "error",
      });
    } finally {
      setCreatingEscRule(false);
    }
  };

  const handleRefreshSlaStatus = async (grievanceMongoId) => {
    try {
      await api.post(ENDPOINTS.SLA.UPDATE_GRIEVANCE_STATUS(grievanceMongoId));
      setToast({ message: "SLA status refreshed", type: "success" });
      refetchBreached();
      refetchEscalationSummary();
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Unable to refresh SLA status",
        type: "error",
      });
    }
  };

  const handleLoadEscalationHistory = async (grievanceMongoId) => {
    setSelectedGrievance(grievanceMongoId);
    setLoadingEscalationHistory(true);
    setEscalationHistory([]);

    try {
      const { data } = await api.get(
        ENDPOINTS.SLA.GRIEVANCE_ESCALATIONS(grievanceMongoId)
      );
      setEscalationHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Failed to load escalation history",
        type: "error",
      });
    } finally {
      setLoadingEscalationHistory(false);
    }
  };

  const handleWardScorecardLookup = async () => {
    if (!selectedWard) return;

    setLoadingWardScorecard(true);
    try {
      const { data } = await api.get(ENDPOINTS.DASHBOARD.WARD_SCORECARD(selectedWard));
      setSelectedWardScorecard(data);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Failed to fetch ward scorecard",
        type: "error",
      });
    } finally {
      setLoadingWardScorecard(false);
    }
  };

  const handleWardChange = async (wardId) => {
    setSelectedWard(wardId);
    if (!wardId) {
      setSelectedWardScorecard(null);
      return;
    }

    setLoadingWardScorecard(true);
    try {
      const { data } = await api.get(ENDPOINTS.DASHBOARD.WARD_SCORECARD(wardId));
      setSelectedWardScorecard(data);
    } catch (error) {
      setToast({
        message: error.response?.data?.message || "Failed to fetch ward scorecard",
        type: "error",
      });
    } finally {
      setLoadingWardScorecard(false);
    }
  };

  if (loadingAny) return <Loader text="Loading SLA control center..." />;

  return (
    <div className="sla-page">
      <div className="page-header">
        <div>
          <h2>SLA Control Center</h2>
          <p className="text-muted">
            Manage SLA rules, watch breaches, and review ward performance.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline btn-sm" onClick={refreshAll}>
            Refresh Data
          </button>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon bg-blue">⏱️</div>
          <div>
            <p className="card-label">SLA Rules</p>
            <h3 className="card-value">{(slaRules || []).length}</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-red">🚨</div>
          <div>
            <p className="card-label">Breached Grievances</p>
            <h3 className="card-value">{breached?.count || 0}</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-yellow">📢</div>
          <div>
            <p className="card-label">Escalations (Notified)</p>
            <h3 className="card-value">{escalationSummary?.notified || 0}</h3>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon bg-green">🏙️</div>
          <div>
            <p className="card-label">Wards Tracked</p>
            <h3 className="card-value">{wardScorecards?.total_wards || 0}</h3>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="sla-form-shell">
            <div className="sla-form-head">
              <div className="sla-form-icon">⏱️</div>
              <div>
                <h4 className="chart-title">Create SLA Rule</h4>
                <p className="text-muted">Define target response times by severity and category.</p>
              </div>
            </div>
            <form className="sla-form" onSubmit={handleCreateSlaRule}>
              <div className="sla-field">
                <label className="sla-label">Rule Name</label>
                <input
                  className="input"
                  placeholder="High Severity - Drainage"
                  value={slaForm.rule_name}
                  onChange={(e) =>
                    setSlaForm((prev) => ({ ...prev, rule_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="sla-form-grid">
                <div className="sla-field">
                  <label className="sla-label">Severity</label>
                  <select
                    className="input"
                    value={slaForm.severity_level}
                    onChange={(e) =>
                      setSlaForm((prev) => ({ ...prev, severity_level: e.target.value }))
                    }
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="sla-field">
                  <label className="sla-label">Category (Optional)</label>
                  <input
                    className="input"
                    placeholder="Drainage"
                    value={slaForm.category}
                    onChange={(e) =>
                      setSlaForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                  />
                </div>
                <div className="sla-field">
                  <label className="sla-label">Response Hours</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    placeholder="24"
                    value={slaForm.response_hours}
                    onChange={(e) =>
                      setSlaForm((prev) => ({ ...prev, response_hours: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="sla-form-footer">
                <p className="text-muted">Rule applies to all categories when category is empty.</p>
                <button className="btn btn-primary btn-sm" disabled={creatingSlaRule}>
                  {creatingSlaRule ? "Creating..." : "Create SLA Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="chart-card">
          <div className="sla-form-shell">
            <div className="sla-form-head">
              <div className="sla-form-icon">📢</div>
              <div>
                <h4 className="chart-title">Create Escalation Rule</h4>
                <p className="text-muted">Define when breach alerts are sent and in what order.</p>
              </div>
            </div>
            <form className="sla-form" onSubmit={handleCreateEscalationRule}>
              <div className="sla-field">
                <label className="sla-label">Rule Name</label>
                <input
                  className="input"
                  placeholder="Escalate at 2 Hours Breach"
                  value={escalationForm.rule_name}
                  onChange={(e) =>
                    setEscalationForm((prev) => ({ ...prev, rule_name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="sla-form-grid sla-form-grid-2">
                <div className="sla-field">
                  <label className="sla-label">Breach Threshold (Hours)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="2"
                    value={escalationForm.breach_hours_threshold}
                    onChange={(e) =>
                      setEscalationForm((prev) => ({
                        ...prev,
                        breach_hours_threshold: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="sla-field">
                  <label className="sla-label">Priority</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    placeholder="10"
                    value={escalationForm.priority}
                    onChange={(e) =>
                      setEscalationForm((prev) => ({ ...prev, priority: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="sla-form-footer">
                <p className="text-muted">Lower priority number means escalation triggers sooner.</p>
                <button className="btn btn-primary btn-sm" disabled={creatingEscRule}>
                  {creatingEscRule ? "Creating..." : "Create Escalation Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="section">
        <h3>SLA Rules</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Severity</th>
                <th>Category</th>
                <th>Response (hrs)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(slaRules || []).length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center">No SLA rules found</td>
                </tr>
              ) : (
                (slaRules || []).map((rule) => (
                  <tr key={rule._id}>
                    <td>{rule.rule_name}</td>
                    <td>{rule.severity_level}</td>
                    <td>{rule.category || "All"}</td>
                    <td>{rule.response_hours}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: rule.active ? "#dcfce7" : "#e5e7eb",
                          color: rule.active ? "#166534" : "#374151",
                        }}
                      >
                        {rule.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {rule.active ? (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDeactivateSlaRule(rule._id)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h3>Escalation Rules</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rule</th>
                <th>Breach Threshold</th>
                <th>Priority</th>
                <th>Roles</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(escalationRules || []).length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center">No escalation rules found</td>
                </tr>
              ) : (
                (escalationRules || []).map((rule) => (
                  <tr key={rule._id}>
                    <td>{rule.rule_name}</td>
                    <td>{rule.breach_hours_threshold}h</td>
                    <td>{rule.priority}</td>
                    <td>{(rule.escalate_to_roles || []).join(", ") || "-"}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: rule.active ? "#dbeafe" : "#e5e7eb",
                          color: rule.active ? "#1e3a8a" : "#374151",
                        }}
                      >
                        {rule.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h3>Breached Grievances</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Grievance ID</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Ward</th>
                <th>Due Date</th>
                <th>SLA</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {breaches.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center">
                    No currently breached grievances
                  </td>
                </tr>
              ) : (
                breaches.map((item) => (
                  <tr key={item._id}>
                    <td>{item.grievance_id}</td>
                    <td>{item.category}</td>
                    <td>{item.severity_level}</td>
                    <td>{item.ward_id || "-"}</td>
                    <td>{toDateTime(item.sla_due_date)}</td>
                    <td>
                      <span className="badge" style={STATUS_STYLE.Breached}>
                        Breached
                      </span>
                    </td>
                    <td>
                      <div className="sla-actions-cell">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleRefreshSlaStatus(item._id)}
                        >
                          Refresh Status
                        </button>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleLoadEscalationHistory(item._id)}
                        >
                          Escalation History
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="section">
        <h3>Ward SLA Scorecards</h3>
        <div className="charts-row">
          <div className="chart-card">
            <h4 className="chart-title">All Wards Analytics</h4>
            <div className="sla-comparison-grid">
              <div>
                <p className="card-label">Total Grievances</p>
                <h3 className="card-value">{allWardAnalytics.totalGrievances}</h3>
              </div>
              <div>
                <p className="card-label">Total Resolved</p>
                <h3 className="card-value">{allWardAnalytics.totalResolved}</h3>
              </div>
              <div>
                <p className="card-label">Total Breached</p>
                <h3 className="card-value">{allWardAnalytics.totalBreached}</h3>
              </div>
              <div>
                <p className="card-label">Average Resolution Rate</p>
                <h3 className="card-value">{toPercent(wardComparison?.avg_resolution_rate)}%</h3>
              </div>
              <div>
                <p className="card-label">Average SLA Compliance</p>
                <h3 className="card-value">{toPercent(wardComparison?.avg_sla_compliance)}%</h3>
              </div>
              <div>
                <p className="card-label">Average Citizen Satisfaction</p>
                <h3 className="card-value">{toPercent(wardComparison?.avg_citizen_satisfaction)}</h3>
              </div>
              <div>
                <p className="card-label">Best Resolution Ward</p>
                <h3 className="card-value">{allWardAnalytics.topResolutionWard?.ward_id || "-"}</h3>
                <p className="text-muted">
                  {toPercent(allWardAnalytics.topResolutionWard?.summary?.resolution_rate)}%
                </p>
              </div>
              <div>
                <p className="card-label">Best SLA Compliance Ward</p>
                <h3 className="card-value">{allWardAnalytics.topComplianceWard?.ward_id || "-"}</h3>
                <p className="text-muted">
                  {toPercent(allWardAnalytics.topComplianceWard?.sla_metrics?.sla_compliance_rate)}%
                </p>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <h4 className="chart-title">Ward Ranking and Grade Mix</h4>
            <div className="sla-ranking-list">
              {allWardAnalytics.resolutionRanking.map((card) => (
                <div key={card.ward_id} className="sla-ranking-item">
                  <div className="sla-ranking-head">
                    <span className="sla-ranking-ward">{card.ward_id}</span>
                    <span className="sla-ranking-metric">
                      {toPercent(card.summary?.resolution_rate)}% resolution
                    </span>
                  </div>
                  <div className="sla-ranking-track">
                    <div
                      className="sla-ranking-fill"
                      style={{ width: `${Math.max(2, card.summary?.resolution_rate || 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="sla-grade-row">
              {Object.entries(allWardAnalytics.gradeDistribution).map(([grade, count]) => (
                <span key={grade} className="chip chip-blue">
                  Grade {grade}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card" style={{ marginTop: "1rem" }}>
          <h4 className="chart-title">Ward Selection and Detailed Analytics</h4>
          <div className="sla-lookup-row">
            <select
              className="input"
              value={selectedWard}
              onChange={(e) => handleWardChange(e.target.value)}
            >
              <option value="">Select Ward</option>
              {wardIds.map((wardId) => (
                <option key={wardId} value={wardId}>
                  {wardId}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleWardScorecardLookup}
              disabled={!selectedWard || loadingWardScorecard}
            >
              {loadingWardScorecard ? "Loading..." : "Reload Ward Analytics"}
            </button>
          </div>
          {selectedWardScorecard && (
            <div className="sla-ward-card">
              <div className="sla-comparison-grid">
                <div>
                  <p className="card-label">Ward</p>
                  <h3 className="card-value">{selectedWardScorecard.ward_id}</h3>
                </div>
                <div>
                  <p className="card-label">Grade</p>
                  <h3 className="card-value">
                    {selectedWardScorecard.performance_grade?.grade || "-"}
                  </h3>
                  <p className="text-muted">
                    {selectedWardScorecard.performance_grade?.label || "No grade"}
                  </p>
                </div>
                <div>
                  <p className="card-label">Resolution Rate</p>
                  <h3 className="card-value">
                    {toPercent(selectedWardScorecard.summary?.resolution_rate)}%
                  </h3>
                </div>
                <div>
                  <p className="card-label">SLA Compliance</p>
                  <h3 className="card-value">
                    {toPercent(selectedWardScorecard.sla_metrics?.sla_compliance_rate)}%
                  </h3>
                </div>
                <div>
                  <p className="card-label">Avg Resolution Time</p>
                  <h3 className="card-value">
                    {toPercent(selectedWardScorecard.summary?.avg_resolution_time_hours)}h
                  </h3>
                </div>
                <div>
                  <p className="card-label">Citizen Satisfaction</p>
                  <h3 className="card-value">
                    {toPercent(selectedWardScorecard.summary?.avg_citizen_satisfaction)}
                  </h3>
                </div>
              </div>

              <div className="charts-row" style={{ marginTop: "1rem" }}>
                <div className="chart-card">
                  <h4 className="chart-title">SLA Status Breakdown</h4>
                  <div className="sla-grade-row">
                    <span className="chip chip-green">
                      On Track: {selectedWardScorecard.sla_metrics?.on_track ?? 0}
                    </span>
                    <span className="chip chip-orange">
                      At Risk: {selectedWardScorecard.sla_metrics?.at_risk ?? 0}
                    </span>
                    <span className="chip chip-red">
                      Breached: {selectedWardScorecard.sla_metrics?.breached ?? 0}
                    </span>
                  </div>
                </div>
                <div className="chart-card">
                  <h4 className="chart-title">Severity Distribution</h4>
                  <div className="sla-grade-row">
                    {(selectedWardScorecard.severity_distribution || []).map((item) => (
                      <span key={item.severity} className="chip chip-teal">
                        {item.severity}: {item.total} ({toPercent(item.percentage)}%)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="chart-card" style={{ marginTop: "1rem" }}>
                <h4 className="chart-title">Top Categories (Ward)</h4>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Total</th>
                        <th>Resolved</th>
                        <th>Resolution Rate</th>
                        <th>Avg Citizen Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedWardScorecard.top_categories || []).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center">No category analytics</td>
                        </tr>
                      ) : (
                        (selectedWardScorecard.top_categories || []).map((row) => (
                          <tr key={row.category}>
                            <td>{row.category}</td>
                            <td>{row.total_complaints}</td>
                            <td>{row.resolved}</td>
                            <td>{toPercent(row.resolution_rate)}%</td>
                            <td>{toPercent(row.avg_citizen_rating)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!selectedGrievance}
        onClose={() => setSelectedGrievance(null)}
        title="Escalation History"
        size="lg"
      >
        {loadingEscalationHistory ? (
          <Loader text="Loading escalation history..." />
        ) : escalationHistory.length === 0 ? (
          <p className="text-muted">No escalation history found for this grievance.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Breach Hours</th>
                  <th>Escalated At</th>
                  <th>Status</th>
                  <th>Roles</th>
                </tr>
              </thead>
              <tbody>
                {escalationHistory.map((history) => (
                  <tr key={history._id}>
                    <td>{history.breach_hours}</td>
                    <td>{toDateTime(history.escalated_at)}</td>
                    <td>{history.escalation_status}</td>
                    <td>{(history.escalated_to_roles || []).join(", ") || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default SLAControlCenter;
