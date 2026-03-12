import { useState } from "react";
import API from "../services/api";

const PRIORITIES = ["low", "medium", "high"];

function BugForm({ refresh }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  const createBug = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await API.post("/bugs", { title, description, priority });
      setTitle("");
      setDescription("");
      setPriority("medium");
      refresh();
    } catch (err) {
      console.error("Error creating bug");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <div className="form-card-title">
        <div className="icon">＋</div>
        Report a Bug
      </div>

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
    </div>
  );
}

export default BugForm;
