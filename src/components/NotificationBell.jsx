import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as notificationService from "../services/notificationService";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unreadCount: 0 });
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      setData(res);
    } catch (err) {
      // Backend may be offline or CORS/network issue — keep UI usable
      setData({ notifications: [], unreadCount: 0 });
      if (import.meta.env.DEV) {
        console.warn("Notifications unavailable:", err.message || "Network error");
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 60000);
    return () => clearInterval(t);
  }, []);

  const handleMarkRead = async (id, bugId) => {
    try {
      await notificationService.markNotificationRead(id);
      fetchNotifications();
      if (bugId) {
        setOpen(false);
        navigate(`/bugs/${bugId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllNotificationsRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen(!open)}
        title="Notifications"
        style={{ position: "relative", padding: "6px 10px", fontSize: 18 }}
      >
        🔔
        {data.unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: "#ef4444",
              color: "#fff",
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {data.unreadCount > 99 ? "99+" : data.unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "100%",
              marginTop: 8,
              width: 320,
              maxHeight: 400,
              overflow: "auto",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "var(--shadow-card)",
              zIndex: 20,
              padding: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "4px 8px" }}>
              <strong>Notifications</strong>
              {data.unreadCount > 0 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            {data.notifications.length === 0 ? (
              <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 13 }}>No notifications</div>
            ) : (
              data.notifications.slice(0, 20).map((n) => (
                <div
                  key={n._id}
                  onClick={() => n.bugId && handleMarkRead(n._id, n.bugId._id || n.bugId)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: n.read ? "transparent" : "var(--bg-hover)",
                    cursor: n.bugId ? "pointer" : "default",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  <div style={{ color: "var(--text-primary)" }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
