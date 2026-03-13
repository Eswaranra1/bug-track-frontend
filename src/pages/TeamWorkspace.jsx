import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { DndContext, closestCenter } from "@dnd-kit/core";
import API from "../services/api";
import AppLayout from "../components/AppLayout";
import BugCard from "../components/BugCard";

const COLUMNS = [
  { id: "open", title: "Open" },
  { id: "triaged", title: "Triaged" },
  { id: "in-progress", title: "In Progress" },
  { id: "in-review", title: "In Review" },
  { id: "testing", title: "Testing" },
  { id: "resolved", title: "Resolved" },
  { id: "closed", title: "Closed" },
];

const ACTION_LABEL = {
  CREATED: "created bug",
  ASSIGNED: "assigned",
  STATUS_CHANGED: "changed status",
  PRIORITY_CHANGED: "changed priority",
  COMMENT_ADDED: "added comment",
  ATTACHMENT_ADDED: "added attachment",
  TIME_UPDATED: "updated time",
  CLOSED: "closed",
};

export default function TeamWorkspace() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await API.get(`/teams/${id}/workspace`);
      setData(res.data);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || !active || !data?.bugs) return;
    const bugId = active.id;
    const targetStatus = over.id;
    if (!COLUMNS.some((c) => c.id === targetStatus)) return;
    const bug = data.bugs.find((b) => b._id === bugId);
    if (!bug || bug.status === targetStatus) return;
    setUpdatingId(bugId);
    try {
      const res = await API.put(`/bugs/${bugId}`, { status: targetStatus });
      const updated = res.data;
      setData((prev) => ({
        ...prev,
        bugs: prev.bugs.map((b) => (b._id === bugId ? updated : b)),
      }));
      const actRes = await API.get(`/teams/${id}/workspace`);
      setData((prev) => ({ ...prev, recentActivity: actRes.data.recentActivity }));
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const byStatus = (status) => (data?.bugs || []).filter((b) => (b.status || "open") === status);

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="loading-screen">
          <div className="spinner" />
        </div>
      </AppLayout>
    );
  }
  if (!data) {
    return (
      <AppLayout>
        <div className="bug-card" style={{ padding: 24 }}>
          <p>Could not load workspace.</p>
          <Link to="/teams" className="btn btn-ghost btn-sm">Back to teams</Link>
        </div>
      </AppLayout>
    );
  }

  const { team, members, bugStats, recentActivity, bugs } = data;

  return (
    <AppLayout>
      <div className="dashboard-header" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0 }}>{team?.name || "Team Workspace"}</h1>
          <Link to={`/teams/${id}`} className="btn btn-ghost btn-sm">Team settings</Link>
        </div>
        {team?.description && (
          <p style={{ marginTop: 8, color: "var(--text-secondary)" }}>{team.description}</p>
        )}
      </div>

      {/* Stats */}
      <div className="stats-strip" style={{ marginBottom: 24 }}>
        <div className="stat-chip">
          <span className="stat-dot" style={{ background: "#818cf8" }} />
          <span className="stat-count">{bugStats?.open ?? 0}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-chip">
          <span className="stat-dot" style={{ background: "#eab308" }} />
          <span className="stat-count">{bugStats?.inProgress ?? 0}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-chip">
          <span className="stat-dot" style={{ background: "#22c55e" }} />
          <span className="stat-count">{bugStats?.done ?? 0}</span>
          <span className="stat-label">Done</span>
        </div>
        {bugStats?.avgFixTimeHours != null && (
          <div className="stat-chip">
            <span className="stat-count">{bugStats.avgFixTimeHours}h</span>
            <span className="stat-label">Avg fix time</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
        <div>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Kanban (team bugs)</h2>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              {COLUMNS.map((col) => (
                <div
                  key={col.id}
                  id={col.id}
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    padding: 12,
                    minHeight: 100,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                    {col.title} ({byStatus(col.id).length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {byStatus(col.id).map((bug) => (
                      <div key={bug._id} id={bug._id} style={{ opacity: updatingId === bug._id ? 0.5 : 1 }}>
                        <BugCard bug={bug} refresh={load} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DndContext>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="bug-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Recent activity</h3>
            {!recentActivity?.length ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)" }}>No activity yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {recentActivity.slice(0, 15).map((a) => (
                  <li key={a._id} style={{ padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                    <strong>{a.user?.name || "Someone"}</strong> {ACTION_LABEL[a.action] || a.action.toLowerCase()}
                    {a.metadata?.to && (
                      <span style={{ color: "var(--text-muted)" }}> → {a.metadata.to}</span>
                    )}
                    <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      {new Date(a.createdAt).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bug-card" style={{ padding: 16 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Active members</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(members || []).map((m) => (
                <div
                  key={m.user?._id || m.user}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    background: "var(--bg-card)",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "var(--primary)",
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                    }}
                  >
                    {(m.user?.name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  <span>{m.user?.name || "Unknown"}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
