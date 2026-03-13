import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import { getTeamMembers } from "../services/teamService";
import Timeline from "../components/Timeline";
import CommentSection from "../components/CommentSection";
import AttachmentUploader from "../components/AttachmentUploader";
import AppLayout from "../components/AppLayout";

const PRIORITY_COLOR = { high: "#ef4444", medium: "#eab308", low: "#22c55e", critical: "#dc2626" };
const STATUS_COLOR = { open: "#818cf8", triaged: "#a78bfa", "in-progress": "#eab308", "in-review": "#f59e0b", testing: "#06b6d4", resolved: "#22c55e", closed: "#64748b" };
const STATUS_OPTIONS = ["open", "triaged", "in-progress", "in-review", "testing", "resolved", "closed"];

export default function BugDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromKanban = location.state?.fromKanban;
  const [bug, setBug] = useState(null);
  const [activity, setActivity] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [workTimerBusy, setWorkTimerBusy] = useState(false);

  useEffect(() => {
    API.get("/users")
      .then((r) => setAllUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAllUsers([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      API.get(`/bugs/${id}`),
      API.get(`/bugs/${id}/activity`).catch(() => ({ data: [] })),
      API.get("/auth/me").catch(() => ({ data: null })),
    ])
      .then(([bugRes, activityRes, meRes]) => {
        setBug(bugRes.data);
        setActivity(activityRes.data);
        setCurrentUser(meRes.data);
        setForm({
          title: bugRes.data.title,
          description: bugRes.data.description || "",
          priority: bugRes.data.priority || "medium",
          status: bugRes.data.status || "open",
          assignedTo: bugRes.data.assignedTo?._id || "",
          estimatedTime: bugRes.data.estimatedTime ?? "",
          actualTime: bugRes.data.actualTime ?? "",
        });
      })
      .catch((err) => {
        if (err.response?.status === 404 || err.response?.status === 403) navigate("/dashboard");
        else console.error(err);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    const tid = bug?.teamId?._id || bug?.teamId;
    if (!tid) {
      setTeamMembers([]);
      return;
    }
    getTeamMembers(tid)
      .then(setTeamMembers)
      .catch(() => setTeamMembers([]));
  }, [bug?.teamId, bug?._id]);

  const handleSave = async () => {
    if (!bug) return;
    setSaving(true);
    try {
      const payload = { ...form, assignedTo: form.assignedTo || undefined, estimatedTime: form.estimatedTime || undefined, actualTime: form.actualTime || undefined };
      const res = await API.put(`/bugs/${bug._id}`, payload);
      setBug(res.data);
      const actRes = await API.get(`/bugs/${id}/activity`);
      setActivity(actRes.data);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }
  if (!bug) return null;

  return (
    <AppLayout>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <div className="bugs-section-title" style={{ marginBottom: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {fromKanban && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate("/kanban")}
              style={{ marginBottom: 0 }}
            >
              ← Back to Kanban
            </button>
          )}
          <span>Bug details</span>
        </div>

        <div className="bug-card" style={{ padding: 24 }}>
          {editing ? (
            <>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-input" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                    {["low", "medium", "high", "critical"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Estimated (hrs)</label>
                  <input type="number" min={0} step={0.5} className="form-input" value={form.estimatedTime} onChange={(e) => setForm((f) => ({ ...f, estimatedTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Actual (hrs)</label>
                  <input type="number" min={0} step={0.5} className="form-input" value={form.actualTime} onChange={(e) => setForm((f) => ({ ...f, actualTime: e.target.value }))} />
                </div>
              </div>
              {(teamMembers.length > 0 || allUsers.length > 0) && (
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">Assign to</label>
                  <select
                    className="form-input"
                    value={form.assignedTo || ""}
                    onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value || undefined }))}
                  >
                    <option value="">Unassigned</option>
                    {(teamMembers.length > 0 ? teamMembers : allUsers).map((m) => {
                      const u = m?.user ?? m;
                      const uid = (u?._id ?? u)?.toString?.() || u;
                      const name = u?.name || u?.email || "Unknown";
                      return <option key={uid} value={uid}>{name}</option>;
                    })}
                  </select>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <h1 style={{ fontSize: 22, margin: 0 }}>{bug.title}</h1>
                <span
                  className="badge"
                  style={{
                    background: `${STATUS_COLOR[bug.status] || "#64748b"}22`,
                    color: STATUS_COLOR[bug.status] || "#64748b",
                    padding: "6px 12px",
                    borderRadius: 8,
                    textTransform: "capitalize",
                  }}
                >
                  {bug.status}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>
                <span>Priority: <strong style={{ color: PRIORITY_COLOR[bug.priority] || "#eab308" }}>{bug.priority}</strong></span>
                {bug.teamId && <span>Team: {bug.teamId.name}</span>}
                {bug.createdBy && <span>Created by: {bug.createdBy.name}</span>}
                {bug.assignedTo && <span>Assigned to: {bug.assignedTo.name}</span>}
                {bug.estimatedTime != null && <span>Est: {bug.estimatedTime}h</span>}
                {bug.actualTime != null && <span>Actual: {bug.actualTime}h</span>}
                {bug.startDate && <span>Started: {new Date(bug.startDate).toLocaleDateString()}</span>}
                {bug.endDate && <span>Ended: {new Date(bug.endDate).toLocaleDateString()}</span>}
              </div>
              {bug.description && <p style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{bug.description}</p>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit bug</button>
                {(() => {
                  const uid = currentUser?.id || currentUser?._id;
                  const workLogs = bug.workLogs || [];
                  const activeLog = uid && workLogs.find((l) => (l.userId?._id || l.userId)?.toString() === uid && !l.end);
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Work timer:</span>
                      {activeLog ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          disabled={workTimerBusy}
                          onClick={async () => {
                            setWorkTimerBusy(true);
                            try {
                              const res = await API.patch(`/bugs/${bug._id}/stop`);
                              setBug(res.data);
                            } catch (e) { console.error(e); }
                            setWorkTimerBusy(false);
                          }}
                        >
                          {workTimerBusy ? "Stopping…" : "Stop work"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={workTimerBusy}
                          onClick={async () => {
                            setWorkTimerBusy(true);
                            try {
                              const res = await API.patch(`/bugs/${bug._id}/start`);
                              setBug(res.data);
                            } catch (e) { console.error(e); }
                            setWorkTimerBusy(false);
                          }}
                        >
                          {workTimerBusy ? "Starting…" : "Start work"}
                        </button>
                      )}
                      {bug.actualTime != null && <span style={{ fontSize: 13 }}>Logged: {bug.actualTime}h</span>}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </div>

        <div className="bug-card" style={{ padding: 24, marginTop: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Activity</h3>
          <Timeline activities={activity} />
        </div>

        <CommentSection bugId={id} currentUserId={currentUser?._id ?? currentUser?.id} />
        <AttachmentUploader bugId={id} />
      </div>
    </AppLayout>
  );
}
