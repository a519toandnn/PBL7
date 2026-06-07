import {
  clearPendingVnpayReturn,
  getPendingVnpayReturnOrderId,
  markPendingVnpayReturn,
} from './vnpayReturnSession';

const createMemoryStorage = () => {
  const values = new Map();

  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};

describe('vnpayReturnSession', () => {
  it('stores and clears the pending VNPAY return order id', () => {
    const storage = createMemoryStorage();

    markPendingVnpayReturn(42, storage);
    expect(getPendingVnpayReturnOrderId(storage)).toBe('42');

    clearPendingVnpayReturn(storage);
    expect(getPendingVnpayReturnOrderId(storage)).toBe('');
  });
});
