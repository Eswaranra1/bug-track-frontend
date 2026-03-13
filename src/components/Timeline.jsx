import { useMemo } from "react";

const ACTION_LABELS = {
  CREATED: "created bug",
  ASSIGNED: "assigned bug",
  STATUS_CHANGED: "changed status",
  COMMENT_ADDED: "added a comment",
  ATTACHMENT_ADDED: "added an attachment",
  TIME_UPDATED: "updated time",
  CLOSED: "closed bug",
};

function formatMetadata(action, metadata) {
  if (!metadata) return "";
  if (action === "STATUS_CHANGED" && metadata.from && metadata.to) {
    return ` from ${metadata.from} to ${metadata.to}`;
  }
  if (action === "ASSIGNED" && metadata.assigneeId) return " (assigned)";
  if (action === "TIME_UPDATED") return " (time tracking)";
  return "";
}

function formatDate(createdAt) {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Timeline({ activities }) {
  const list = useMemo(() => (Array.isArray(activities) ? [...activities].reverse() : []), [activities]);

  return (
    <div className="timeline" style={{ position: "relative", paddingLeft: 24 }}>
      {list.map((a, i) => (
        <div
          key={a._id}
          className="timeline-item"
          style={{
            position: "relative",
            paddingBottom: 20,
          }}
        >
          {i < list.length - 1 && (
            <div
              style={{
                position: "absolute",
                left: -20,
                top: 8,
                bottom: -12,
                width: 2,
                background: "var(--border)",
                borderRadius: 1,
              }}
            />
          )}
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--primary)",
              position: "absolute",
              left: -24,
              top: 4,
            }}
          />
          <div style={{ fontSize: 13, color: "var(--text-primary)" }}>
            <strong>{a.user?.name || "Someone"}</strong>{" "}
            {ACTION_LABELS[a.action] || a.action}
            {formatMetadata(a.action, a.metadata)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {formatDate(a.createdAt)}
          </div>
        </div>
      ))}
      {list.length === 0 && (
        <div style={{ color: "var(--text-muted)", fontSize: 13 }}>No activity yet.</div>
      )}
    </div>
  );
}
