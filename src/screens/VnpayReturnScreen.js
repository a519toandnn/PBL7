import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaClock, FaExclamationTriangle, FaRedo, FaShoppingBag } from 'react-icons/fa';
import { useHistory, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useOrder from '../hooks/useOrder';
import { apiFetch, getAuthHeaders } from '../utils/apiClient';
import { clearStoredCheckoutByOrderId } from '../utils/checkoutStorage';
import { formatCurrency } from '../utils/productsApi';

const MAX_STATUS_POLLS = 8;
const POLL_INTERVAL_MS = 2500;

const getPaymentStatus = (payload) => payload?.payment?.status || payload?.payment_status || '';

const getOrderStatus = (payload) => payload?.order_status || payload?.status || '';

const parseAmount = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const VnpayReturnScreen = () => {
  const location = useLocation();
  const history = useHistory();
  const { user } = useAuth();
  const { loadCart } = useOrder();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const orderId = query.get('order_id');
  const returnSuccess = query.get('success') === 'true';
  const responseCode = query.get('vnp_ResponseCode');
  const transactionStatus = query.get('vnp_TransactionStatus');
  const [statusPayload, setStatusPayload] = useState(null);
  const [pollCount, setPollCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState('');

  const fetchPaymentStatus = useCallback(async () => {
    if (!orderId) {
      setError('Khong tim thay ma don hang trong ket qua thanh toan.');
      setLoading(false);
      return null;
    }

    try {
      setError('');
      const payload = await apiFetch(`/payment/order/${orderId}/status`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      setStatusPayload(payload);

      if (payload?.is_paid && user?.id) {
        clearStoredCheckoutByOrderId(user.id, orderId);
        await loadCart();
      }

      return payload;
    } catch (err) {
      setError(err?.message || 'Khong the kiem tra trang thai thanh toan.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadCart, orderId, user?.id]);

  useEffect(() => {
    let timer;
    let cancelled = false;

    const run = async () => {
      const payload = await fetchPaymentStatus();
      if (cancelled) return;

      const paymentStatus = getPaymentStatus(payload);
      if (!payload?.is_paid && paymentStatus === 'PENDING' && pollCount < MAX_STATUS_POLLS) {
        timer = setTimeout(() => {
          if (!cancelled) {
            setPollCount((current) => current + 1);
          }
        }, POLL_INTERVAL_MS);
      }
    };

    run();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchPaymentStatus, pollCount]);

  const paymentStatus = getPaymentStatus(statusPayload);
  const orderStatus = getOrderStatus(statusPayload);
  const isPaid = Boolean(statusPayload?.is_paid);
  const isFailed = paymentStatus === 'FAILED';
  const isPending = !isPaid && paymentStatus === 'PENDING';
  const amount = parseAmount(statusPayload?.amount || statusPayload?.payment?.amount);

  const retryPayment = () => {
    history.push('/checkout');
  };

  const renderIcon = () => {
    if (isPaid) return <FaCheckCircle className="text-6xl text-green-500" />;
    if (isFailed) return <FaExclamationTriangle className="text-6xl text-red-500" />;
    return <FaClock className="text-6xl text-blue-500" />;
  };

  const title = (() => {
    if (loading) return 'Dang kiem tra thanh toan';
    if (isPaid) return 'Thanh toan thanh cong';
    if (isFailed) return 'Thanh toan that bai';
    if (isPending) return 'Dang xac nhan thanh toan';
    return 'Chua xac dinh duoc trang thai thanh toan';
  })();

  const description = (() => {
    if (loading) return 'FE dang goi BE de lay trang thai don hang sau khi VNPAY redirect ve.';
    if (isPaid) return 'BE da xac nhan thanh toan thanh cong va don hang da duoc cap nhat.';
    if (isFailed) return 'Giao dich VNPAY that bai hoac da bi huy. Ban co the thanh toan lai bang chinh don hang nay.';
    if (isPending) return 'ReturnURL da ve FE, nhung IPN co the chua cap nhat kip. Trang se tu kiem tra lai trong vai giay.';
    return error || 'Vui long kiem tra lai don hang hoac thu thanh toan lai.';
  })();

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-24">
      <section className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {renderIcon()}
          <h1 className="mt-5 text-3xl font-bold text-gray-900">{title}</h1>
          <p className="mt-3 max-w-2xl text-gray-600">{description}</p>
        </div>

        <div className="mt-8 rounded-lg border border-gray-100 bg-gray-50 p-5">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-gray-500">Ma don hang</dt>
              <dd className="mt-1 font-bold text-gray-900">{orderId || 'Khong co'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500">So tien</dt>
              <dd className="mt-1 font-bold text-blue-600">{amount ? formatCurrency(amount) : 'Dang cap nhat'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500">Trang thai don</dt>
              <dd className="mt-1 font-bold text-gray-900">{orderStatus || 'Dang cap nhat'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500">Trang thai thanh toan</dt>
              <dd className="mt-1 font-bold text-gray-900">{paymentStatus || 'Dang cap nhat'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500">VNPAY response</dt>
              <dd className="mt-1 font-bold text-gray-900">{responseCode || 'Khong co'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500">VNPAY transaction</dt>
              <dd className="mt-1 font-bold text-gray-900">{transactionStatus || 'Khong co'}</dd>
            </div>
          </dl>
        </div>

        {returnSuccess && isPending && (
          <div className="mt-5 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            VNPAY ReturnURL hop le, nhung FE van cho BE xac nhan qua IPN truoc khi xem la da thanh toan.
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-md border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {isFailed && (
            <button
              type="button"
              onClick={retryPayment}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
            >
              <FaRedo />
              Thanh toan lai
            </button>
          )}
          <button
            type="button"
            onClick={() => history.push('/orders')}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-3 font-bold text-gray-700 hover:bg-gray-50"
          >
            <FaShoppingBag />
            Xem don hang
          </button>
          {isPending && (
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setPollCount(0);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-5 py-3 font-bold text-blue-700 hover:bg-blue-100"
            >
              Kiem tra lai
            </button>
          )}
        </div>
      </section>
    </main>
  );
};

export default VnpayReturnScreen;
