import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

const COMMANDS = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", icon: "🏠" },
  { key: "my", label: "My Bugs", path: "/dashboard?view=my", icon: "🧑‍💻" },
  { key: "created", label: "Created by me", path: "/dashboard?view=created", icon: "📝" },
  { key: "team", label: "Team bugs", path: "/dashboard?view=team", icon: "👥" },
  { key: "kanban", label: "Kanban", path: "/kanban", icon: "📊" },
  { key: "teams", label: "Teams", path: "/teams", icon: "👥" },
  { key: "activity", label: "Activity", path: "/activity", icon: "📋" },
  { key: "analytics", label: "Analytics", path: "/analytics", icon: "📈" },
];

export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [quickCreate, setQuickCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ title: "", priority: "medium", teamId: "" });
  const [submitting, setSubmitting] = useState(false);

  const filtered = COMMANDS.filter(
    (c) => !search.trim() || c.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setQuickCreate(false);
        setOpen((v) => !v);
        setSearch("");
      }
      if (e.key === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
        e.preventDefault();
        setOpen(false);
        setQuickCreate((v) => !v);
        setForm({ title: "", priority: "medium", teamId: "" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (quickCreate) {
      API.get("/teams")
        .then((r) => setTeams(r.data || []))
        .catch(() => setTeams([]));
    }
  }, [quickCreate]);

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
      setOpen(false);
    },
    [navigate]
  );

  const handleQuickCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        priority: form.priority,
        ...(form.teamId ? { teamId: form.teamId } : {}),
      };
      const res = await API.post("/bugs", payload);
      setQuickCreate(false);
      navigate(`/bugs/${res.data._id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open && !quickCreate) return null;

  if (quickCreate) {
    return (
      <div
        className="modal-overlay"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
        onClick={() => setQuickCreate(false)}
      >
        <div
          className="bug-card"
          style={{ padding: 24, maxWidth: 400, width: "90%", margin: 16 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ marginBottom: 16 }}>Quick create bug</h3>
          <form onSubmit={handleQuickCreate}>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Bug title"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-input"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              >
                {["low", "medium", "high", "critical"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Team (optional)</label>
              <select
                className="form-input"
                value={form.teamId}
                onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
              >
                <option value="">None</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || !form.title.trim()}>
                {submitting ? "Creating…" : "Create"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setQuickCreate(false)}>
                Cancel
              </button>
            </div>
          </form>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>Press C again to close</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "15vh",
        zIndex: 9999,
      }}
      onClick={() => setOpen(false)}
    >
      <div
        className="bug-card"
        style={{ padding: 12, width: "100%", maxWidth: 420, maxHeight: "70vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Search… (e.g. Dashboard, Kanban)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{ marginBottom: 8 }}
        />
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {filtered.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "flex-start", gap: 10 }}
                onClick={() => handleNavigate(c.path)}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            </li>
          ))}
        </ul>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>Ctrl+K to close · Press C to quick create bug</p>
      </div>
    </div>
  );
}
