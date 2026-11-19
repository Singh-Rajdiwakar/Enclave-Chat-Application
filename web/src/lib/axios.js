import axios from "axios";

// In production (in browser on Render or custom domain), use same-origin relative "/api"
// Only fallback to VITE_API_URL / localhost:3000 in local dev
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isLocalhost) {
      return "/api";
    }
  }
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  return `${apiUrl.replace(/\/api\/?$/, "")}/api`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
});

export default api;
