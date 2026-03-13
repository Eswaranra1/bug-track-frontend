const base = (import.meta.env.VITE_API_URL || "https://bug-track-backend-jz4l.onrender.com/api").replace(/\/api\/?$/, "");

export function getUploadUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${base}${path.startsWith("/") ? path : "/" + path}`;
}
