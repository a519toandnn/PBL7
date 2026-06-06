import * as crypto from 'crypto';

export type VnpayParams = Record<
  string,
  string | number | boolean | null | undefined
>;

function normalizeVnpayParams(params: VnpayParams): Record<string, string> {
  return Object.entries(params)
    .filter(
      ([key, value]) =>
        key !== 'vnp_SecureHash' &&
        key !== 'vnp_SecureHashType' &&
        value !== null &&
        value !== undefined &&
        String(value) !== '',
    )
    .sort(([left], [right]) => left.localeCompare(right))
    .reduce<Record<string, string>>((normalized, [key, value]) => {
      normalized[key] = String(value);
      return normalized;
    }, {});
}

function toVnpaySignData(params: VnpayParams): string {
  return Object.entries(normalizeVnpayParams(params))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

export function createVnpSecureHash(
  params: VnpayParams,
  hashSecret: string,
): string {
  return crypto
    .createHmac('sha512', hashSecret)
    .update(toVnpaySignData(params), 'utf8')
    .digest('hex');
}

export function verifyVnpSecureHash(
  params: VnpayParams,
  hashSecret: string,
): boolean {
  const receivedHash = params.vnp_SecureHash;
  if (!receivedHash) {
    return false;
  }

  const expectedHash = createVnpSecureHash(params, hashSecret);
  return expectedHash.toLowerCase() === String(receivedHash).toLowerCase();
}

export function buildVnpayPaymentUrl(options: {
  paymentUrl: string;
  hashSecret: string;
  params: VnpayParams;
}): string {
  const normalizedParams = normalizeVnpayParams(options.params);
  const secureHash = createVnpSecureHash(normalizedParams, options.hashSecret);
  const query = new URLSearchParams({
    ...normalizedParams,
    vnp_SecureHash: secureHash,
  });

  return `${options.paymentUrl}?${query.toString()}`;
}

export function formatVnpayDate(date: Date): string {
  const pad = (value: number) => value.toString().padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}
