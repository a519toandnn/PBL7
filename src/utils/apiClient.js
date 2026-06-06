import { clearStoredAuth, getStoredToken, isTokenExpired, notifyAuthExpired } from './authToken';

const DEFAULT_API_BASE = 'http://localhost:3001';

export const getApiBaseUrl = () => {
  return (
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_API_URL ||
    DEFAULT_API_BASE
  ).trim();
};

export const getAuthHeaders = (contentType = 'application/json') => {
  const token = getStoredToken();
  const validToken = token && !isTokenExpired(token) ? token : '';

  if (token && !validToken) {
    clearStoredAuth();
    notifyAuthExpired();
  }

  return {
    ...(contentType ? { 'Content-Type': contentType } : {}),
    ...(validToken ? { Authorization: `Bearer ${validToken}` } : {}),
  };
};

export const unwrapEnvelope = (json) => {
  if (json && Object.prototype.hasOwnProperty.call(json, 'data')) {
    return json.data;
  }

  return json;
};

export const getListData = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${getApiBaseUrl()}${path}`, options);
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(json?.message || `API error ${res.status}`);
    error.status = res.status;
    if (res.status === 401) {
      clearStoredAuth();
      notifyAuthExpired();
    }
    throw error;
  }

  return unwrapEnvelope(json);
};

export const resolveApiAsset = (url, fallback = '') => {
  if (!url) return fallback;
  if (/^https?:\/\//i.test(url)) return url;
  return `${getApiBaseUrl()}${url.startsWith('/') ? url : `/${url}`}`;
};
