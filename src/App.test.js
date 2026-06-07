import { getRootPaymentReturnRedirect, shouldRedirectRootPaymentReturn } from './App';

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

describe('getRootPaymentReturnRedirect', () => {
  it('redirects root VNPAY return query to the payment result screen', () => {
    expect(getRootPaymentReturnRedirect('/?order_id=12&success=true')).toBe(
      '/payment/vnpay-return?order_id=12&success=true'
    );
  });

  it('redirects root without query when a pending VNPAY order exists in the session', () => {
    expect(getRootPaymentReturnRedirect('/', '12')).toBe('/payment/vnpay-return?order_id=12');
  });

  it('does not redirect normal root visits without a pending VNPAY order', () => {
    expect(getRootPaymentReturnRedirect('/')).toBe('');
  });
});
