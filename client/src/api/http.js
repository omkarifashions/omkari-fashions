import axios from "axios";

export const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(
  /\/$/,
  "",
);

const http = axios.create({
  baseURL: `${API_ORIGIN}/api`,
  withCredentials: true,
  timeout: 30000,
});

// Normalise errors so every screen can show err.userMessage.
http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    let message = err.response?.data?.message;
    // Blob responses (PDF downloads) carry the JSON error inside a Blob.
    if (
      err.response?.data instanceof Blob &&
      err.response.data.type?.includes("json")
    ) {
      try {
        message = JSON.parse(await err.response.data.text()).message;
      } catch {
        /* ignore */
      }
    }
    if (!err.response)
      message =
        err.code === "ECONNABORTED"
          ? "The request timed out. Please try again."
          : "Network error. Please check your internet connection.";
    if (!message) message = "Something went wrong. Please try again.";
    err.userMessage = message;
    err.status = status;
    const url = err.config?.url || "";
    const isAuthCall =
      /^\/auth\/(login|register|me|admin\/login|admin\/me|forgot-password|reset-password)/.test(
        url,
      );
    if (status === 401 && !isAuthCall) {
      const isAdminRequest = url.startsWith("/admin");

      // Only dispatch the auth-expired event for the session
      // that the failed request actually belongs to.
      window.dispatchEvent(
        new CustomEvent("auth:expired", {
          detail: {
            admin: isAdminRequest,
            url,
          },
        }),
      );
    }

    return Promise.reject(err);
  },
);

export const unwrap = (p) => p.then((r) => r.data);
export default http;
