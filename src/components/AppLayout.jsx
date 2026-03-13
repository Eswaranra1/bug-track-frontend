import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import NotificationBell from "./NotificationBell";
import CommandPalette from "./CommandPalette";
import { useTheme } from "../utils/theme";
import { logout } from "../utils/auth";

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    API.get("/teams")
      .then((r) => setTeams(Array.isArray(r.data) ? r.data : []))
      .catch(() => setTeams([]));
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isDashboard = location.pathname.startsWith("/dashboard");

  const search = location.search || "";
  const dashboardActive = (view) => {
    if (!location.pathname.startsWith("/dashboard")) return false;
    const q = new URLSearchParams(search);
    const v = q.get("view");
    return view === (v || "all");
  };

  return (
    <div className="app-shell">
      <div
        className={`app-sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        aria-hidden="true"
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="app-sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="navbar-brand-icon">🐛</div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>BugTrack</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Productivity Cloud</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="app-sidebar-close"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="app-sidebar-nav" aria-label="Main">
          <div>
            <div className="app-nav-group-label">Work</div>
            <NavLink
              to="/dashboard"
              className={() => `app-nav-link ${dashboardActive("all") ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="app-nav-link-icon">🏠</span>
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/dashboard?view=my"
              className={() => `app-nav-link ${dashboardActive("my") ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="app-nav-link-icon">🧑‍💻</span>
              <span>My Bugs</span>
            </NavLink>
            <NavLink
              to="/dashboard?view=created"
              className={() => `app-nav-link ${dashboardActive("created") ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="app-nav-link-icon">📝</span>
              <span>Created by me</span>
            </NavLink>
            <NavLink
              to="/dashboard?view=team"
              className={() => `app-nav-link ${dashboardActive("team") ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="app-nav-link-icon">📂</span>
              <span>Team bugs</span>
            </NavLink>
            <NavLink
              to="/kanban"
              className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="app-nav-link-icon">📊</span>
              <span>Kanban Board</span>
            </NavLink>
          </div>

          <div>
            <div className="app-nav-group-label">Teams</div>
            <NavLink
              to="/teams"
              className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="app-nav-link-icon">👥</span>
              <span>All teams</span>
            </NavLink>
            {teams.slice(0, 12).map((team) => (
              <NavLink
                key={team._id}
                to={`/teams/${team._id}/workspace`}
                className={({ isActive }) => `app-nav-link app-nav-link-team ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
                style={{ paddingLeft: 28, fontSize: 12 }}
              >
                <span className="app-nav-link-icon">📂</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team.name || "Team"}</span>
              </NavLink>
            ))}
          </div>

          <div>
            <div className="app-nav-group-label">Insights</div>
            <NavLink
              to="/activity"
              className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="app-nav-link-icon">📋</span>
              <span>Activity</span>
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="app-nav-link-icon">📈</span>
              <span>Analytics</span>
            </NavLink>
          </div>

          <div>
            <div className="app-nav-group-label">System</div>
            <button
              type="button"
              className="app-nav-link"
              style={{ opacity: 0.6, cursor: "not-allowed" }}
              aria-disabled="true"
            >
              <span className="app-nav-link-icon">⚙️</span>
              <span>Settings (soon)</span>
            </button>
          </div>
        </nav>

        <div className="app-sidebar-footer">
          <div>Signed in workspace</div>
          <div style={{ opacity: 0.8 }}>Ready for real-time updates</div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="app-sidebar-toggle"
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
            >
              ☰
            </button>
            <span style={{ fontWeight: 500 }}>
              {isDashboard ? "Dashboard" : "Workspace"}
            </span>
          </div>
          <div className="app-topbar-right">
            <NotificationBell />
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="btn btn-ghost btn-sm"
              style={{ width: 34, height: 34, borderRadius: "999px", padding: 0 }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              id="logout-btn-top"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="app-main-content">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}

export default AppLayout;

