import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getTeams, createTeam } from "../services/teamService";
import { logout } from "../utils/auth";
import { useTheme } from "../utils/theme";
import AppLayout from "../components/AppLayout";

const ROLE_OPTIONS = [
  { value: "manager", label: "Manager" },
  { value: "developer", label: "Developer" },
  { value: "qa", label: "QA" },
  { value: "member", label: "Member" },
];

export default function TeamPage() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [invites, setInvites] = useState([]);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const loadTeams = () => {
    getTeams()
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const addInvite = () => setInvites((prev) => [...prev, { email: "", role: "developer" }]);
  const updateInvite = (i, field, value) => {
    setInvites((prev) => prev.map((inv, j) => (j === i ? { ...inv, [field]: value } : inv)));
  };
  const removeInvite = (i) => setInvites((prev) => prev.filter((_, j) => j !== i));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const members = invites.filter((inv) => inv.email.trim()).map((inv) => ({ email: inv.email.trim(), role: inv.role }));
      await createTeam({ name: name.trim(), description: description.trim() || undefined, members });
      setName("");
      setDescription("");
      setInvites([]);
      setShowCreate(false);
      loadTeams();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  const memberCount = (t) => {
    const m = t.members;
    if (!m) return 0;
    return Array.isArray(m) ? m.length : 0;
  };

  return (
    <AppLayout>
      <div className="dashboard-header">
        <div>
          <h1 style={{ marginBottom: 4 }}>Teams</h1>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>Manage workspaces with roles: Admin, Manager, Developer, QA.</p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "Cancel" : "+ Create team"}
          </button>
      </div>

      {showCreate && (
          <div className="form-card" style={{ padding: 24, marginBottom: 24 }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Create team</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Team name</label>
                <input
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Frontend Squad"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What this team works on"
                  rows={2}
                />
              </div>
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label className="form-label">Invite by email (optional)</label>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addInvite}>+ Add</button>
                </div>
                {invites.map((inv, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="teammate@example.com"
                      value={inv.email}
                      onChange={(e) => updateInvite(i, "email", e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <select
                      className="form-input"
                      value={inv.role}
                      onChange={(e) => updateInvite(i, "role", e.target.value)}
                      style={{ width: 130 }}
                    >
                      {ROLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeInvite(i)}>✕</button>
                  </div>
                ))}
              </div>
              <button type="submit" className="btn btn-primary" disabled={creating || !name.trim()}>
                {creating ? "Creating…" : "Create team"}
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading-screen"><div className="spinner" /></div>
        ) : teams.length === 0 ? (
          <div className="empty-state">
            <p>No teams yet. Use the button above to create your first team.</p>
          </div>
        ) : (
          <div className="bug-grid">
            {teams.map((t) => (
              <Link key={t._id} to={`/teams/${t._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="bug-card" style={{ cursor: "pointer" }}>
                  <div className="bug-card-title">{t.name}</div>
                  {t.description && <p className="bug-card-desc">{t.description}</p>}
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {memberCount(t)} members · Created by {t.createdBy?.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
    </AppLayout>
  );
}
