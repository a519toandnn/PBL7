const CHECKOUT_ORDER_PREFIX = 'pending_checkout_order';
const ACTIVE_CHECKOUT_PREFIX = 'active_checkout_order';

export const getCheckoutOrderStorageKey = (userId, cartItemIds = []) => {
  const stableIds = [...cartItemIds].sort((a, b) => Number(a) - Number(b)).join(',');
  return `${CHECKOUT_ORDER_PREFIX}:${userId}:${stableIds}`;
};

export const getActiveCheckoutStorageKey = (userId) => `${ACTIVE_CHECKOUT_PREFIX}:${userId}`;

export const loadStoredCheckout = (storageKey) => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

export const saveStoredCheckout = (storageKey, checkout) => {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      ...checkout,
      updatedAt: new Date().toISOString(),
    })
  );
};

export const clearStoredCheckout = (storageKey) => {
  localStorage.removeItem(storageKey);
};

export const clearStoredCheckoutByOrderId = (userId, orderId) => {
  const activeKey = getActiveCheckoutStorageKey(userId);
  const activeCheckout = loadStoredCheckout(activeKey);

  if (String(activeCheckout?.orderId) !== String(orderId)) {
    return;
  }

  if (Array.isArray(activeCheckout.cartItemIds)) {
    clearStoredCheckout(getCheckoutOrderStorageKey(userId, activeCheckout.cartItemIds));
  }

  clearStoredCheckout(activeKey);
};
