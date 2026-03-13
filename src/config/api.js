/**
 * API configuration. baseURL must end with /api.
 */
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return "http://localhost:5000/api";
  return "https://bug-track-backend-jz4l.onrender.com/api";
};

export const API_BASE_URL = getBaseURL();
