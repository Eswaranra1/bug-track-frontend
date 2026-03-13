import { useEffect, useState } from "react";
import API from "../services/api";
import AppLayout from "../components/AppLayout";

function BarRow({ label, value, max }) {
  const width = max > 0 ? `${Math.max(4, (value / max) * 100)}%` : "0%";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
        {label} <span style={{ color: "var(--text-muted)" }}>· {value}</span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "var(--bg-card)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width,
            height: "100%",
            borderRadius: 999,
            background: "linear-gradient(90deg, var(--primary), var(--secondary))",
            transition: "width 0.25s ease",
          }}
        />
      </div>
    </div>
  );
}

function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get("/analytics/bugs");
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) {
          setError(e.response?.data?.message || "Failed to load analytics");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byStatus = data?.byStatus ?? {};
  const byPriority = data?.byPriority ?? {};
  const byTeam = data?.byTeam ?? {};
  const resolutionTimeAvgHours = data?.resolutionTimeAvgHours ?? null;
  const statusMax = Math.max(0, ...Object.values(byStatus));
  const priorityMax = Math.max(0, ...Object.values(byPriority));

  return (
    <AppLayout>
      <div className="dashboard-header">
        <h1>Analytics</h1>
        <p>Counts by status, priority, resolution time, and team (from API).</p>
      </div>
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}>
          <div className="spinner" />
        </div>
      ) : error ? (
        <div className="bug-card" style={{ padding: 20 }}>
          <p style={{ color: "var(--text-secondary)" }}>{error}</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 2fr)",
            gap: 18,
          }}
        >
          <div className="bug-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Bugs by status</h3>
            {Object.keys(byStatus).length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No data yet.</div>
            ) : (
              Object.entries(byStatus).map(([status, count]) => (
                <BarRow key={status} label={status} value={count} max={statusMax} />
              ))
            )}
          </div>

          <div className="bug-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Bugs by priority</h3>
            {Object.keys(byPriority).length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No data yet.</div>
            ) : (
              Object.entries(byPriority).map(([priority, count]) => (
                <BarRow
                  key={priority}
                  label={priority}
                  value={count}
                  max={priorityMax}
                />
              ))
            )}
          </div>

          <div className="bug-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Average resolution time</h3>
            <p style={{ fontSize: 32, fontWeight: 700, marginBottom: 6 }}>
              {resolutionTimeAvgHours != null ? resolutionTimeAvgHours.toFixed(1) : "—"}{" "}
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}>
                hours
              </span>
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Calculated from bugs with both start and end dates.
            </p>
          </div>

          <div className="bug-card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Team performance</h3>
            {Object.keys(byTeam).length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>No team data yet.</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 13 }}>
                {Object.entries(byTeam).map(([teamName, info]) => (
                  <li
                    key={teamName}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <span>{teamName}</span>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {info.resolved}/{info.total} resolved
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default Analytics;
