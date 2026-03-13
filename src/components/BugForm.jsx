import { useState, useEffect } from "react";
import API from "../services/api";
import TeamSelector from "./TeamSelector";
import { getTeamMembers } from "../services/teamService";

const PRIORITIES = ["low", "medium", "high", "critical"];

function BugForm({ refresh }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [teamId, setTeamId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    API.get("/users")
      .then((r) => setAllUsers(Array.isArray(r.data) ? r.data : []))
      .catch(() => setAllUsers([]));
  }, []);

  useEffect(() => {
    if (!teamId) {
      setTeamMembers([]);
      setAssignedTo("");
      return;
    }
    getTeamMembers(teamId)
      .then(setTeamMembers)
      .catch(() => setTeamMembers([]));
    setAssignedTo("");
  }, [teamId]);

  const assigneeOptions = teamId && teamMembers.length > 0 ? teamMembers : allUsers;
  const getAssigneeLabel = (m) => {
    const u = m?.user ?? m;
    return u?.name || u?.email || "Unknown";
  };
  const getAssigneeId = (m) => {
    const u = m?.user ?? m;
    return (u?._id ?? u)?.toString?.() || u;
  };

  const createBug = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const body = { title, description, priority };
      if (teamId) body.teamId = teamId;
      if (assignedTo) body.assignedTo = assignedTo;
      await API.post("/bugs", body);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setTeamId("");
      setAssignedTo("");
      setIsOpen(false);
      refresh();
    } catch (err) {
      console.error("Error creating bug");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card" style={{ padding: isOpen ? "20px" : "15px 20px" }}>
      <div 
        className="form-card-title" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: "pointer", margin: isOpen ? "0 0 16px" : 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="icon">{isOpen ? "−" : "＋"}</div>
          Report a Bug
        </div>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {isOpen ? "Hide" : "Show"}
        </span>
      </div>

      {isOpen && (
        <form onSubmit={createBug}>
          <div className="form-row">
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Title</label>
              <input
                id="bug-title"
                className="form-input"
                value={title}
                placeholder="Short description of the bug"
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Priority</label>
              <select
                id="bug-priority"
                className="form-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "14px" }}>
            <label className="form-label">Team <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
            <TeamSelector value={teamId} onChange={setTeamId} placeholder="Personal (no team)" />
          </div>

          {assigneeOptions.length > 0 && (
            <div className="form-group" style={{ marginTop: "14px" }}>
              <label className="form-label">Assign to <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
              <select
                className="form-input"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Unassigned</option>
                {assigneeOptions.map((m) => (
                  <option key={getAssigneeId(m)} value={getAssigneeId(m)}>{getAssigneeLabel(m)}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group" style={{ marginTop: "14px" }}>
            <label className="form-label">Description <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
            <textarea
              id="bug-description"
              className="form-input"
              value={description}
              placeholder="Steps to reproduce, expected vs actual behavior…"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button id="bug-submit" className="btn btn-primary" type="submit" disabled={loading || !title.trim()}>
              {loading ? "Reporting…" : "Report Bug"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default BugForm;
