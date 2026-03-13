import { Link } from "react-router-dom";
import { useTheme } from "../utils/theme";
import AppLayout from "../components/AppLayout";

export default function NotFound() {
  const { theme, toggleTheme } = useTheme();

  return (
    <AppLayout>
      <div style={{ textAlign: "center", paddingTop: 80 }}>
        <h1 style={{ fontSize: 72, margin: 0, color: "var(--text-muted)" }}>404</h1>
        <p style={{ fontSize: 18, color: "var(--text-muted)", marginTop: 8 }}>Page not found</p>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: 24 }}>Go to Dashboard</Link>
      </div>
    </AppLayout>
  );
}
