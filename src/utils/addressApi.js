import { apiFetch, getAuthHeaders } from './apiClient';

export const fetchUserAddresses = async () => {
  const payload = await apiFetch('/user/addresses/list', {
    headers: getAuthHeaders(null),
  });
  return Array.isArray(payload) ? payload : [];
};
