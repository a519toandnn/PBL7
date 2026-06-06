const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const AUTH_EXPIRED_EVENT = 'auth:expired';

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return atob(padded);
};

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

export const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getJwtPayload = (token) => {
  if (!token || token === 'undefined' || token === 'null') return null;

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload));
  } catch (error) {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = getJwtPayload(token);
  if (!payload?.exp) return true;

  return payload.exp * 1000 <= Date.now();
};

export const hasValidStoredToken = () => {
  const token = getStoredToken();
  return Boolean(token) && !isTokenExpired(token);
};

export const notifyAuthExpired = () => {
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
};

export const onAuthExpired = (handler) => {
  window.addEventListener(AUTH_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler);
};
