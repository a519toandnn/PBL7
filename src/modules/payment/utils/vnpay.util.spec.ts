import * as crypto from 'crypto';
import {
  buildVnpayPaymentUrl,
  createVnpSecureHash,
  formatVnpayDate,
  verifyVnpSecureHash,
} from './vnpay.util';

describe('vnpay util', () => {
  const hashSecret = 'test-secret';

  it('creates an HMAC SHA512 secure hash from sorted params', () => {
    const params = {
      vnp_TxnRef: 'PBL7-7-1719999999999',
      vnp_Amount: '15000000',
      vnp_TmnCode: 'TESTCODE',
    };

    const expected = crypto
      .createHmac('sha512', hashSecret)
      .update(
        'vnp_Amount=15000000&vnp_TmnCode=TESTCODE&vnp_TxnRef=PBL7-7-1719999999999',
      )
      .digest('hex');

    expect(createVnpSecureHash(params, hashSecret)).toBe(expected);
  });

  it('builds payment URL with sorted params and secure hash', () => {
    const url = buildVnpayPaymentUrl({
      paymentUrl: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      hashSecret,
      params: {
        vnp_TxnRef: 'PBL7-7-1719999999999',
        vnp_Amount: '15000000',
        vnp_TmnCode: 'TESTCODE',
      },
    });

    expect(url).toContain(
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=15000000&vnp_TmnCode=TESTCODE&vnp_TxnRef=PBL7-7-1719999999999&vnp_SecureHash=',
    );
  });

  it('verifies hash while ignoring vnp_SecureHash and empty params', () => {
    const params = {
      vnp_TxnRef: 'PBL7-7-1719999999999',
      vnp_Amount: '15000000',
      vnp_TmnCode: 'TESTCODE',
      vnp_Empty: '',
    };
    const secureHash = createVnpSecureHash(params, hashSecret);

    expect(
      verifyVnpSecureHash({ ...params, vnp_SecureHash: secureHash }, hashSecret),
    ).toBe(true);
    expect(
      verifyVnpSecureHash(
        { ...params, vnp_SecureHash: 'wrong-signature' },
        hashSecret,
      ),
    ).toBe(false);
  });

  it('signs URL-encoded values like the VNPAY examples', () => {
    const params = {
      vnp_OrderInfo: 'Thanh toan don hang 7',
      vnp_ReturnUrl: 'https://example.com/payment/vnpay/return',
    };

    const expected = crypto
      .createHmac('sha512', hashSecret)
      .update(
        'vnp_OrderInfo=Thanh+toan+don+hang+7&vnp_ReturnUrl=https%3A%2F%2Fexample.com%2Fpayment%2Fvnpay%2Freturn',
      )
      .digest('hex');

    expect(createVnpSecureHash(params, hashSecret)).toBe(expected);
  });

  it('formats dates in Vietnam timezone regardless of server timezone', () => {
    const utcDate = new Date('2026-06-07T01:02:03.000Z');

    expect(formatVnpayDate(utcDate)).toBe('20260607080203');
  });
});
