import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import {
  getTeamById,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  updateTeam,
  deleteTeam,
} from "../services/teamService";
import { useTheme } from "../utils/theme";
import AppLayout from "../components/AppLayout";

const ROLE_LABEL = {
  admin: "Admin",
  manager: "Manager",
  developer: "Developer",
  qa: "QA",
  member: "Member",
};
const ROLE_COLOR = {
  admin: "#7c3aed",
  manager: "#2563eb",
  developer: "#059669",
  qa: "#d97706",
  member: "#64748b",
};

export default function TeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("developer");
  const [adding, setAdding] = useState(false);
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getTeamById(id),
      getTeamMembers(id).catch(() => []),
      API.get("/auth/me").then((r) => r.data).catch(() => null),
    ])
      .then(([t, m, me]) => {
        setTeam(t);
        setMembers(Array.isArray(m) ? m : []);
        setCurrentUser(me);
        setNameVal(t.name);
        const uid = me?.id || me?._id;
        if (!uid) return;
        if (t.createdBy && (t.createdBy._id?.toString() || t.createdBy.toString()) === uid) {
          setMyRole("admin");
          return;
        }
        const mem = (t.members || []).find((x) => {
          const u = x.user?._id || x.user;
          return u && u.toString() === uid;
        });
        setMyRole(mem?.role || null);
      })
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [id]);

  const canManageMembers = myRole === "admin" || myRole === "manager";

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addEmail.trim() || !canManageMembers) return;
    setAdding(true);
    try {
      await addTeamMember(id, { email: addEmail.trim(), role: addRole });
      const m = await getTeamMembers(id);
      setMembers(m);
      setAddEmail("");
      const t = await getTeamById(id);
      setTeam(t);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!canManageMembers) return;
    if (!confirm("Remove this member from the team?")) return;
    try {
      await removeTeamMember(id, userId);
      const m = await getTeamMembers(id);
      setMembers(m);
      const t = await getTeamById(id);
      setTeam(t);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to remove member");
    }
  };

  const handleSaveName = async () => {
    if (!team || nameVal.trim() === team.name) {
      setEditName(false);
      return;
    }
    setSaving(true);
    try {
      await updateTeam(id, { name: nameVal.trim() });
      setTeam((prev) => ({ ...prev, name: nameVal.trim() }));
      setEditName(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (myRole !== "admin") return;
    if (!confirm("Delete this team? This cannot be undone.")) return;
    try {
      await deleteTeam(id);
      navigate("/teams");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete team");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="loading-screen"><div className="spinner" /></div>
      </AppLayout>
    );
  }
  if (!team) {
    return (
      <AppLayout>
        <div>
          <p>Team not found.</p>
          <Link to="/teams">Back to Teams</Link>
        </div>
      </AppLayout>
    );
  }

  const currentUserId = currentUser?.id || currentUser?._id;

  return (
    <AppLayout>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="bugs-section-title" style={{ marginBottom: 18 }}>
          Team overview
        </div>

        <div className="bug-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            {editName ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 200 }}>
                <input
                  className="form-input"
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  style={{ flex: 1 }}
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" onClick={handleSaveName} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => { setEditName(false); setNameVal(team.name); }}>Cancel</button>
              </div>
            ) : (
              <h1 style={{ margin: 0, fontSize: 22 }}>{team.name}</h1>
            )}
            {!editName && canManageMembers && (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditName(true)}>Edit name</button>
            )}
          </div>
          {team.description && <p style={{ color: "var(--text-muted)", marginTop: 8 }}>{team.description}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
            <Link to={`/teams/${id}/workspace`} className="btn btn-primary btn-sm">
              Open workspace
            </Link>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Created by {team.createdBy?.name} · Your role: <strong style={{ color: ROLE_COLOR[myRole] || "#64748b" }}>{ROLE_LABEL[myRole] || "—"}</strong>
            </span>
          </div>
          {myRole === "admin" && (
            <button className="btn btn-ghost btn-sm" onClick={handleDeleteTeam} style={{ color: "var(--red, #dc2626)", marginTop: 12 }}>Delete team</button>
          )}
        </div>

        <div className="bug-card" style={{ padding: 24, marginTop: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Members</h3>

          {canManageMembers && (
            <form onSubmit={handleAddMember} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              <input
                type="email"
                className="form-input"
                placeholder="Email to invite"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                style={{ flex: "1 1 200px", minWidth: 180 }}
              />
              <select
                className="form-input"
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                style={{ width: 140 }}
              >
                {Object.entries(ROLE_LABEL).filter(([k]) => k !== "admin").map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary btn-sm" disabled={adding || !addEmail.trim()}>
                {adding ? "Adding…" : "Add member"}
              </button>
            </form>
          )}

          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {members.map((m) => {
              const u = m.user;
              const uid = u?._id?.toString() || u?.toString();
              const name = u?.name || "Unknown";
              const email = u?.email || "";
              const role = m.role || "member";
              const isCreator = team.createdBy && (team.createdBy._id?.toString() || team.createdBy.toString()) === uid;
              const isMe = uid === currentUserId;
              return (
                <li
                  key={uid}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border)",
                    gap: 12,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>{name}</span>
                    {email && <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{email}</span>}
                    {isCreator && <span style={{ fontSize: 11, marginLeft: 8, color: "var(--text-muted)" }}>(creator)</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 6,
                        background: `${ROLE_COLOR[role] || "#64748b"}22`,
                        color: ROLE_COLOR[role] || "#64748b",
                      }}
                    >
                      {ROLE_LABEL[role]}
                    </span>
                    {canManageMembers && !isCreator && !isMe && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleRemoveMember(uid)}
                        style={{ fontSize: 11, color: "var(--red, #dc2626)" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {members.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No members yet.</p>}
        </div>
      </div>
    </AppLayout>
  );
}
