import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../services/api";
import BugCard from "../components/BugCard";
import BugForm from "../components/BugForm";
import TeamSelector from "../components/TeamSelector";
import AppLayout from "../components/AppLayout";

const PRIORITY_FILTERS = ["all", "high", "medium", "low", "critical"];
const STATUS_FILTERS   = ["all", "open", "triaged", "in-progress", "in-review", "testing", "resolved", "closed"];
const SORT_OPTIONS    = [
  { value: "newest",    label: "Newest first",   sort: "createdAt", order: "desc" },
  { value: "oldest",    label: "Oldest first",   sort: "createdAt", order: "asc" },
  { value: "priority",  label: "Priority",       sort: "priority",  order: "asc" },
  { value: "duration",  label: "Duration",       sort: "endDate",   order: "desc" },
];

const PRIORITY_DOT = { high: "#ef4444", medium: "#eab308", low: "#22c55e", critical: "#dc2626" };

function Dashboard() {
  const [bugs, setBugs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState(null); /* server-side counts: { total, byStatus } */
  const [priorityF, setPriorityF] = useState("all");
  const [statusF, setStatusF]     = useState("all");
  const [search, setSearch]       = useState("");
  const [sortBy, setSortBy]       = useState("newest");
  const [teamId, setTeamId]       = useState("");
  const [fetchError, setFetchError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [searchParams] = useSearchParams();
  const view = searchParams.get("view");
  const [teamGroupBy, setTeamGroupBy] = useState("team"); // "team" | "assignee" for view=team

  const fetchBugs = useCallback(async (page = 1) => {
    setLoading(true);
    setFetchError(null);
    try {
      const opt = SORT_OPTIONS.find((o) => o.value === sortBy) || SORT_OPTIONS[0];
      const scopeMap = { all: "all", my: "mine", created: "created", team: "team" };
      const scope = scopeMap[view] ?? "all";
      const params = {
        scope,
        ...(teamId ? { teamId } : {}),
        ...(priorityF !== "all" ? { priority: priorityF } : {}),
        ...(statusF !== "all" ? { status: statusF } : {}),
        sort: opt.sort,
        order: opt.order,
        page,
        limit: 50,
      };
      const res = await API.get("/bugs", { params });
      const data = res.data;
      setBugs(data.bugs ?? (Array.isArray(data) ? data : []));
      if (data.pagination) setPagination(data.pagination);
    } catch (err) {
      const msg = err.response?.status === 401
        ? "Please sign in again."
        : err.response?.data?.message || err.message || "Could not load bugs. Check your connection.";
      setFetchError(msg);
      setBugs([]);
    } finally {
      setLoading(false);
    }
  }, [teamId, priorityF, statusF, sortBy, view]);

  /* Fetch server-side stats so counts match current view (scope) */
  const fetchStats = useCallback(async () => {
    try {
      const scopeMap = { all: "all", my: "mine", created: "created", team: "team" };
      const scope = scopeMap[view] ?? "all";
      const res = await API.get("/analytics/bugs", { params: { scope } });
      const d = res.data;
      setStats({
        total: d.total ?? 0,
        byStatus: d.byStatus ?? {},
      });
    } catch {
      setStats(null);
    }
  }, [view]);

  const goToPage = (p) => { if (p >= 1 && p <= pagination.totalPages) fetchBugs(p); };

  useEffect(() => { fetchBugs(1); }, [fetchBugs]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  /* ── Client-side search only (team/priority/status are server-side) ── */
  const filtered = bugs.filter((b) => {
    const matchSearch = !search.trim() ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.description || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });
  const sorted = filtered;

  /* ── Team view: group bugs by team or by assignee (each user/email shown) ── */
  const getTeamKey = (bug) => {
    const t = bug.teamId;
    return t?.name || t?._id?.toString() || "_no_team";
  };
  const getTeamLabel = (bug) => {
    const t = bug.teamId;
    return t?.name || "No team";
  };
  const getAssigneeKey = (bug) => {
    const a = bug.assignedTo;
    return a?.email || a?.name || a?._id?.toString() || "_unassigned";
  };
  const getAssigneeLabel = (bug) => {
    const a = bug.assignedTo;
    if (!a) return "Unassigned";
    return a.name ? `${a.name} (${a.email || ""})` : (a.email || "Unknown");
  };
  const isTeamView = view === "team";
  const groupedByTeam = isTeamView && teamGroupBy === "team"
    ? Object.entries(
        sorted.reduce((acc, bug) => {
          const key = getTeamKey(bug);
          if (!acc[key]) acc[key] = [];
          acc[key].push(bug);
          return acc;
        }, {})
      ).map(([key, list]) => ({ key, label: getTeamLabel(list[0]), bugs: list }))
    : [];
  const groupedByAssignee = isTeamView && teamGroupBy === "assignee"
    ? Object.entries(
        sorted.reduce((acc, bug) => {
          const key = getAssigneeKey(bug);
          if (!acc[key]) acc[key] = [];
          acc[key].push(bug);
          return acc;
        }, {})
      ).map(([key, list]) => ({ key, label: getAssigneeLabel(list[0]), bugs: list }))
    : [];

  /* ── Stats: use server-side analytics (normalize keys to lowercase); fallback to current bugs when counts missing ── */
  const rawByStatus = stats?.byStatus ?? {};
  const byStatus = Object.fromEntries(
    Object.entries(rawByStatus).map(([k, v]) => [(k || "open").toLowerCase(), v])
  );
  const openCount     = stats ? ((byStatus.open || 0) + (byStatus.triaged || 0)) : bugs.filter((b) => ["open", "triaged"].includes((b.status || "open").toLowerCase())).length;
  const progressCount = stats ? ((byStatus["in-progress"] || 0) + (byStatus["in-review"] || 0) + (byStatus.testing || 0)) : bugs.filter((b) => ["in-progress", "in-review", "testing"].includes((b.status || "").toLowerCase())).length;
  const resolvedCount = stats ? (byStatus.resolved || 0) : bugs.filter((b) => (b.status || "").toLowerCase() === "resolved").length;
  const closedCount   = stats ? (byStatus.closed || 0) : bugs.filter((b) => (b.status || "").toLowerCase() === "closed").length;
  const totalCount    = stats ? (stats.total ?? 0) : (pagination.total ?? bugs.length);
  /* If backend returned total but no status breakdown, show counts from current bugs so they add up */
  const statusSum = openCount + progressCount + resolvedCount + closedCount;
  const useFallbackCounts = stats && totalCount > 0 && statusSum === 0;
  const displayOpen     = useFallbackCounts ? bugs.filter((b) => ["open", "triaged"].includes((b.status || "open").toLowerCase())).length : openCount;
  const displayProgress = useFallbackCounts ? bugs.filter((b) => ["in-progress", "in-review", "testing"].includes((b.status || "").toLowerCase())).length : progressCount;
  const displayResolved = useFallbackCounts ? bugs.filter((b) => (b.status || "").toLowerCase() === "resolved").length : resolvedCount;
  const displayClosed   = useFallbackCounts ? bugs.filter((b) => (b.status || "").toLowerCase() === "closed").length : closedCount;

  return (
    <AppLayout>
      <div className="dashboard-header">
        {/* Header */}
        <h1>Bug Dashboard</h1>
        <p>
          {view === "my"
            ? "Only bugs assigned to you — your account only, not shared with others."
            : view === "created"
            ? "Bugs you created."
            : view === "team"
            ? "Bugs in your teams — split by team or by assignee (each person’s bugs)."
            : "All bugs from everyone — open to all users."}
        </p>
      </div>

      <div>
        {fetchError && (
          <div
            role="alert"
            style={{
              padding: "12px 16px",
              marginBottom: 16,
              borderRadius: 8,
              background: "var(--red, #dc2626)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span>{fetchError}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { fetchBugs(1); fetchStats(); }} style={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}>
              Retry
            </button>
          </div>
        )}

        {/* Stats Strip */}
        <div className="stats-strip">
          <div className="stat-chip">
            <span className="stat-dot" style={{ background: "#818cf8" }} />
            <span className="stat-count">{displayOpen}</span>
            <span className="stat-label">Open</span>
          </div>
          <div className="stat-chip">
            <span className="stat-dot" style={{ background: "#eab308" }} />
            <span className="stat-count">{displayProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-chip">
            <span className="stat-dot" style={{ background: "#22c55e" }} />
            <span className="stat-count">{displayResolved}</span>
            <span className="stat-label">Resolved</span>
          </div>
          <div className="stat-chip">
            <span className="stat-dot" style={{ background: "#64748b" }} />
            <span className="stat-count">{displayClosed}</span>
            <span className="stat-label">Closed</span>
          </div>
          <div className="stat-chip" style={{ marginLeft: "auto" }}>
            <span className="stat-count">{totalCount}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        {/* Bug Form */}
        <BugForm refresh={() => { fetchBugs(1); fetchStats(); }} />

        {/* ── Filter Bar ── */}
        <div className="filter-bar">
          {/* Search */}
          <input
            className="form-input filter-search"
            placeholder="🔍  Search bugs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Team filter */}
          <div className="filter-group">
            <span className="filter-label">Team</span>
            <TeamSelector value={teamId} onChange={setTeamId} placeholder="All teams" />
          </div>

          {/* Priority pills */}
          <div className="filter-group">
            <span className="filter-label">Priority</span>
            {PRIORITY_FILTERS.map((p) => (
              <button
                key={p}
                className={`filter-pill ${priorityF === p ? "filter-pill-active" : ""}`}
                style={p !== "all" && priorityF === p && PRIORITY_DOT[p]
                  ? { borderColor: PRIORITY_DOT[p], color: PRIORITY_DOT[p], background: `${PRIORITY_DOT[p]}18` }
                  : {}}
                onClick={() => setPriorityF(p)}
              >
                {p !== "all" && PRIORITY_DOT[p] && (
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: PRIORITY_DOT[p], display: "inline-block", marginRight: 5
                  }} />
                )}
                {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* Status pills */}
          <div className="filter-group">
            <span className="filter-label">Status</span>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                className={`filter-pill ${statusF === s ? "filter-pill-active" : ""}`}
                onClick={() => setStatusF(s)}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort by date */}
          <div className="filter-group">
            <span className="filter-label">Sort</span>
            <select
              className="form-input filter-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort bugs by date"
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: 13,
                minWidth: 140,
                cursor: "pointer",
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Active count */}
          {(priorityF !== "all" || statusF !== "all" || search || teamId) && (
            <button
              className="filter-clear"
              onClick={() => { setPriorityF("all"); setStatusF("all"); setSearch(""); setTeamId(""); }}
            >
              ✕ Clear filters
            </button>
          )}
        </div>

        {/* Team view: group by team or assignee */}
        {isTeamView && sorted.length > 0 && (
          <div className="filter-group" style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", marginRight: 8 }}>Group by:</span>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
              <input type="radio" name="teamGroupBy" checked={teamGroupBy === "team"} onChange={() => setTeamGroupBy("team")} />
              Team
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, marginLeft: 12 }}>
              <input type="radio" name="teamGroupBy" checked={teamGroupBy === "assignee"} onChange={() => setTeamGroupBy("assignee")} />
              Assignee (each person / email)
            </label>
          </div>
        )}

        {/* Bug Section Label */}
        <div className="bugs-section-title">
          {filtered.length} {filtered.length === 1 ? "Bug" : "Bugs"}
          {(priorityF !== "all" || statusF !== "all" || search) && " (filtered)"}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{bugs.length === 0 ? "🎉" : "🔍"}</div>
            <h3>{bugs.length === 0 ? "No bugs reported yet" : "No bugs match your filters"}</h3>
            <p>{bugs.length === 0
              ? "Use the form above to report your first bug"
              : "Try adjusting your priority or status filters"}
            </p>
          </div>
        ) : isTeamView && (groupedByTeam.length > 0 || groupedByAssignee.length > 0) ? (
          <>
            {teamGroupBy === "team" && groupedByTeam.map(({ key, label, bugs: groupBugs }) => (
              <div key={key} className="team-bugs-group" style={{ marginBottom: 28 }}>
                <h3 className="bugs-section-title" style={{ fontSize: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "var(--accent-dim)", color: "var(--accent-light)", padding: "4px 10px", borderRadius: 8 }}>Team: {label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>({groupBugs.length})</span>
                </h3>
                <div className="bug-grid">
                  {groupBugs.map((bug) => (
                    <BugCard key={bug._id} bug={bug} refresh={() => { fetchBugs(pagination.page); fetchStats(); }} />
                  ))}
                </div>
              </div>
            ))}
            {teamGroupBy === "assignee" && groupedByAssignee.map(({ key, label, bugs: groupBugs }) => (
              <div key={key} className="team-bugs-group" style={{ marginBottom: 28 }}>
                <h3 className="bugs-section-title" style={{ fontSize: 15, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "var(--bg-card)", color: "var(--text-primary)", padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border)" }}>
                    {key === "_unassigned" ? "Unassigned" : `Assigned to: ${label}`}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-muted)" }}>({groupBugs.length})</span>
                </h3>
                <div className="bug-grid">
                  {groupBugs.map((bug) => (
                    <BugCard key={bug._id} bug={bug} refresh={() => { fetchBugs(pagination.page); fetchStats(); }} />
                  ))}
                </div>
              </div>
            ))}
            {pagination.totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => goToPage(pagination.page - 1)} disabled={pagination.page <= 1}>Previous</button>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => goToPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>Next</button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bug-grid">
              {sorted.map((bug) => (
                <BugCard key={bug._id} bug={bug} refresh={() => { fetchBugs(pagination.page); fetchStats(); }} />
              ))}
            </div>
            {pagination.totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </button>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default Dashboard;
