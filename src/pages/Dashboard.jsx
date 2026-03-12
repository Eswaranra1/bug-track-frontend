import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import BugCard from "../components/BugCard";
import BugForm from "../components/BugForm";
import { logout } from "../utils/auth";
import { useTheme } from "../utils/theme";

const PRIORITY_FILTERS = ["all", "high", "medium", "low"];
const STATUS_FILTERS   = ["all", "open", "in-progress", "resolved"];

const PRIORITY_DOT = { high: "#ef4444", medium: "#eab308", low: "#22c55e" };

function Dashboard() {
  const [bugs, setBugs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [priorityF, setPriorityF] = useState("all");
  const [statusF, setStatusF]     = useState("all");
  const [search, setSearch]       = useState("");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const fetchBugs = async () => {
    try {
      const res = await API.get("/bugs");
      setBugs(res.data);
    } catch (err) {
      console.error("Error fetching bugs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBugs(); }, []);

  const handleLogout = () => { logout(); navigate("/"); };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  /* ── Filtering ── */
  const filtered = bugs.filter((b) => {
    const matchPriority = priorityF === "all" || (b.priority || "medium") === priorityF;
    const matchStatus   = statusF   === "all" || (b.status   || "open")   === statusF;
    const matchSearch   = !search.trim() ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.description || "").toLowerCase().includes(search.toLowerCase());
    return matchPriority && matchStatus && matchSearch;
  });

  /* ── Stats ── */
  const openCount     = filtered.filter((b) => (b.status || "open") === "open").length;
  const progressCount = filtered.filter((b) => b.status === "in-progress").length;
  const resolvedCount = filtered.filter((b) => b.status === "resolved").length;

  return (
    <div className="dashboard-layout">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-brand-icon">🐛</div>
          BugTrack
        </div>
        <div className="navbar-actions">
          <button
            id="theme-toggle"
            className="btn btn-ghost btn-sm"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{ fontSize: "16px", padding: "6px 10px" }}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button id="logout-btn" className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <h1>Bug Dashboard</h1>
          <p>Track, manage and resolve issues across your project</p>
        </div>

        {/* Stats Strip */}
        <div className="stats-strip">
          <div className="stat-chip">
            <span className="stat-dot" style={{ background: "#818cf8" }} />
            <span className="stat-count">{openCount}</span>
            <span className="stat-label">Open</span>
          </div>
          <div className="stat-chip">
            <span className="stat-dot" style={{ background: "#eab308" }} />
            <span className="stat-count">{progressCount}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-chip">
            <span className="stat-dot" style={{ background: "#22c55e" }} />
            <span className="stat-count">{resolvedCount}</span>
            <span className="stat-label">Resolved</span>
          </div>
          <div className="stat-chip" style={{ marginLeft: "auto" }}>
            <span className="stat-count">{bugs.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        {/* Bug Form */}
        <BugForm refresh={fetchBugs} />

        {/* ── Filter Bar ── */}
        <div className="filter-bar">
          {/* Search */}
          <input
            className="form-input filter-search"
            placeholder="🔍  Search bugs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Priority pills */}
          <div className="filter-group">
            <span className="filter-label">Priority</span>
            {PRIORITY_FILTERS.map((p) => (
              <button
                key={p}
                className={`filter-pill ${priorityF === p ? "filter-pill-active" : ""}`}
                style={p !== "all" && priorityF === p
                  ? { borderColor: PRIORITY_DOT[p], color: PRIORITY_DOT[p], background: `${PRIORITY_DOT[p]}18` }
                  : {}}
                onClick={() => setPriorityF(p)}
              >
                {p !== "all" && (
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

          {/* Active count */}
          {(priorityF !== "all" || statusF !== "all" || search) && (
            <button
              className="filter-clear"
              onClick={() => { setPriorityF("all"); setStatusF("all"); setSearch(""); }}
            >
              ✕ Clear filters
            </button>
          )}
        </div>

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
        ) : (
          <div className="bug-grid">
            {filtered.map((bug) => (
              <BugCard key={bug._id} bug={bug} refresh={fetchBugs} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
