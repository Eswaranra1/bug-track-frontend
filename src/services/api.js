import axios from "axios";
import { logout } from "../utils/auth";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

/* ── Attach JWT to every request ── */
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

/* ── Handle expired / invalid token globally ── */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      logout();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;
