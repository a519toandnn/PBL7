const PENDING_VNPAY_RETURN_KEY = 'pending_vnpay_return_order_id';

const getStorage = (storage) => {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
};

export const markPendingVnpayReturn = (orderId, storage) => {
  const targetStorage = getStorage(storage);
  if (!targetStorage || !orderId) return;

  targetStorage.setItem(PENDING_VNPAY_RETURN_KEY, String(orderId));
};

export const getPendingVnpayReturnOrderId = (storage) => {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return '';

  return targetStorage.getItem(PENDING_VNPAY_RETURN_KEY) || '';
};

export const clearPendingVnpayReturn = (storage) => {
  const targetStorage = getStorage(storage);
  if (!targetStorage) return;

  targetStorage.removeItem(PENDING_VNPAY_RETURN_KEY);
};
