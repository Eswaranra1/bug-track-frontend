import { useState, useEffect } from "react";
import { getTeams } from "../services/teamService";

export default function TeamSelector({ value, onChange, placeholder = "All teams", allowEmpty = true }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <select
      className="form-input filter-sort"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="Filter by team"
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "var(--bg-surface)",
        color: "var(--text-primary)",
        fontSize: 13,
        minWidth: 140,
        cursor: "pointer",
      }}
    >
      {allowEmpty && (
        <option value="">{placeholder}</option>
      )}
      {loading ? (
        <option>Loading…</option>
      ) : (
        teams.map((t) => (
          <option key={t._id} value={t._id}>
            {t.name}
          </option>
        ))
      )}
    </select>
  );
}
