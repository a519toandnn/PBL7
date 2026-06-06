import * as crypto from 'crypto';
import {
  buildVnpayPaymentUrl,
  createVnpSecureHash,
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
      .update('vnp_Amount=15000000&vnp_TmnCode=TESTCODE&vnp_TxnRef=PBL7-7-1719999999999')
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
});
