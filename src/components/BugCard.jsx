import { useState } from "react";
import API from "../services/api";

const STATUS_CLASS = {
  open:          "badge-open",
  "in-progress": "badge-progress",
  resolved:      "badge-resolved",
};

const PRIORITY_COLOR = {
  high:   "#ef4444",
  medium: "#eab308",
  low:    "#22c55e",
};

function BugCard({ bug, refresh }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title:       bug.title,
    description: bug.description || "",
    priority:    bug.priority    || "medium",
    status:      bug.status      || "open",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await API.put(`/bugs/${bug._id}`, form);
      refresh();
      setEditing(false);
    } catch (err) {
      console.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      title:       bug.title,
      description: bug.description || "",
      priority:    bug.priority    || "medium",
      status:      bug.status      || "open",
    });
    setEditing(false);
  };

  const deleteBug = async () => {
    try {
      await API.delete(`/bugs/${bug._id}`);
      refresh();
    } catch (err) {
      console.error("Delete failed");
    }
  };

  const priority    = bug.priority || "medium";
  const statusClass = STATUS_CLASS[bug.status] || "badge-open";

  /* ── Edit mode ── */
  if (editing) {
    return (
      <div className="bug-card" style={{ gap: 12 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Title</label>
          <input
            className="form-input"
            name="title"
            value={form.title}
            onChange={handleChange}
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Description</label>
          <textarea
            className="form-input"
            name="description"
            value={form.description}
            onChange={handleChange}
            style={{ minHeight: 72 }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Priority</label>
            <select className="form-input" name="priority" value={form.priority} onChange={handleChange}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-input" name="status" value={form.status} onChange={handleChange}>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <button className="btn btn-ghost btn-sm" onClick={handleCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            style={{ width: "auto", marginTop: 0, padding: "7px 18px" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  /* ── View mode ── */
  return (
    <div className="bug-card">
      <div className="bug-card-header">
        <span className="bug-card-title">{bug.title}</span>
        <span className={`badge ${statusClass}`} style={{ flexShrink: 0 }}>
          {bug.status || "open"}
        </span>
      </div>

      {bug.description && (
        <p className="bug-card-desc">{bug.description}</p>
      )}

      <div className="bug-card-footer">
        <span style={{
          fontSize: "11px",
          fontWeight: 600,
          color: PRIORITY_COLOR[priority],
          background: `${PRIORITY_COLOR[priority]}18`,
          padding: "3px 10px",
          borderRadius: "20px",
          textTransform: "capitalize",
        }}>
          ↑ {priority}
        </span>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: "12px", padding: "5px 12px" }}
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
          <button className="btn btn-danger" onClick={deleteBug}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default BugCard;
