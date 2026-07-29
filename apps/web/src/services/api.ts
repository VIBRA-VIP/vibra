import axios from 'axios';

/**
 * On HTTPS sites (Netlify), never call http://API directly (browser blocks mixed content).
 * Use same-origin `/api/*` which Netlify proxies to Lightsail.
 */
function resolveBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL || '').trim().replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && raw.startsWith('http:')) {
    return '';
  }

  if (!raw) {
    return '';
  }

  return raw;
}

export const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vibra_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
