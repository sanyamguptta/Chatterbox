import axios from 'axios';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

// Single Axios instance used across the entire app
const api = axios.create({
  baseURL: `${SERVER_URL}/api`,
  withCredentials: true, // send cookies (refresh token) with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ───────────────────────────────────────────────────────
// Automatically attaches the access token from memory to every request
api.interceptors.request.use((config) => {
  // Access token is stored in a module-level variable (not localStorage)
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────────────────────
// If a 401 TOKEN_EXPIRED is received, try to refresh and retry the request
let isRefreshing = false;
let refreshSubscribers = []; // queue of callbacks waiting for new token

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;

      if (isRefreshing) {
        // Wait for the ongoing refresh to complete
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await axios.post(
          `${SERVER_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = response.data;
        setAccessToken(accessToken);
        onRefreshed(accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        // Refresh failed — force logout
        setAccessToken(null);
        window.location.href = '/auth';
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── In-memory token store ─────────────────────────────────────────────────────
// NOT localStorage — access token lives only in JS memory for security
let _accessToken = null;

export function setAccessToken(token) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

export default api;
