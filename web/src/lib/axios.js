import axios from "axios";

const apiUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:3000" : "");

const api = axios.create({
  baseURL: apiUrl ? `${apiUrl.replace(/\/api\/?$/, "")}/api` : "/api",
  withCredentials: true,
});

export default api;
