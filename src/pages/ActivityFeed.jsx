import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import AppLayout from "../components/AppLayout";

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

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/activity", { params: { limit: 50 } })
      .then((res) => setActivities(res.data?.activities ?? []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="dashboard-header">
        <h1>Activity feed</h1>
        <p>Recent actions across all bugs visible to you.</p>
      </div>
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}>
          <div className="spinner" />
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <p style={{ color: "var(--text-muted)" }}>No activity yet.</p>
        </div>
      ) : (
        <div className="bug-card" style={{ padding: 0, overflow: "hidden" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {activities.map((a) => (
              <li
                key={a._id}
                style={{
                  padding: "14px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  {(a.user?.name || "?").slice(0, 1).toUpperCase()}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{a.user?.name || "Someone"}</span>
                  <span style={{ marginLeft: 6 }}>{ACTION_LABEL[a.action] || a.action}</span>
                  {a.bugId && (
                    <Link
                      to={`/bugs/${a.bugId._id || a.bugId}`}
                      style={{
                        marginLeft: 6,
                        color: "var(--primary)",
                        fontSize: 14,
                        textDecoration: "none",
                      }}
                    >
                      {typeof a.bugId === "object" && a.bugId.title ? a.bugId.title : `#${(a.bugId._id || a.bugId).toString().slice(-6)}`}
                    </Link>
                  )}
                  {a.metadata?.from != null && a.metadata?.to != null && (
                    <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>
                      {a.metadata.from} → {a.metadata.to}
                    </span>
                  )}
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppLayout>
  );
}
