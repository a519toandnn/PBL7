import { shouldRedirectRootPaymentReturn } from './App';

describe('shouldRedirectRootPaymentReturn', () => {
  it('detects VNPAY return query on the root path', () => {
    expect(shouldRedirectRootPaymentReturn('/?order_id=12&success=true')).toBe(true);
    expect(shouldRedirectRootPaymentReturn('/?vnp_ResponseCode=00&vnp_TxnRef=PBL7-12')).toBe(true);
    expect(shouldRedirectRootPaymentReturn('/?payment_status=SUCCESS&order_status=PAID')).toBe(true);
  });

  it('does not redirect normal root visits', () => {
    expect(shouldRedirectRootPaymentReturn('/')).toBe(false);
    expect(shouldRedirectRootPaymentReturn('/?utm_source=test')).toBe(false);
    expect(shouldRedirectRootPaymentReturn('/products?order_id=12')).toBe(false);
  });
});
