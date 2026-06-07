import { buildPaymentResultViewModel } from './VnpayReturnScreen';

describe('buildPaymentResultViewModel', () => {
  it('shows a customer-friendly success state when payment is paid', () => {
    const result = buildPaymentResultViewModel({
      loading: false,
      statusPayload: {
        is_paid: true,
        status: 'PAID',
        amount: '60000.00',
        payment: { status: 'SUCCESS' },
      },
      error: '',
    });

    expect(result.tone).toBe('success');
    expect(result.title).toBe('Thanh toán thành công');
    expect(result.description).toBe(
      'Đơn hàng của bạn đã được ghi nhận. Cảm ơn bạn đã mua hàng tại PBL7 Medicine.'
    );
    expect(result.showRetry).toBe(false);
    expect(result.showRefresh).toBe(false);
  });

  it('shows retry action when payment failed', () => {
    const result = buildPaymentResultViewModel({
      loading: false,
      statusPayload: {
        is_paid: false,
        status: 'PENDING',
        payment: { status: 'FAILED' },
      },
      error: '',
    });

    expect(result.tone).toBe('failed');
    expect(result.title).toBe('Thanh toán thất bại');
    expect(result.showRetry).toBe(true);
    expect(result.showRefresh).toBe(false);
  });

  it('keeps pending payments checkable', () => {
    const result = buildPaymentResultViewModel({
      loading: false,
      statusPayload: {
        is_paid: false,
        status: 'PENDING',
        payment: { status: 'PENDING' },
      },
      error: '',
    });

    expect(result.tone).toBe('pending');
    expect(result.title).toBe('Đang xác nhận thanh toán');
    expect(result.showRetry).toBe(false);
    expect(result.showRefresh).toBe(true);
  });
});
