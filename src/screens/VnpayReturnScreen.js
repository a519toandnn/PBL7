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

const getInitialStatusFromQuery = (query) => {
  const paymentStatus = query.get('payment_status');
  const orderStatus = query.get('order_status');

  if (!paymentStatus && !orderStatus) {
    return null;
  }

  return {
    order_id: query.get('order_id'),
    order_status: orderStatus,
    payment: {
      id: query.get('payment_id'),
      status: paymentStatus,
      provider_txn_id: query.get('vnp_TxnRef'),
    },
    is_paid: paymentStatus === 'SUCCESS' || orderStatus === 'PAID',
  };
};

const getStatusLabel = (status) => {
  const labels = {
    PAID: 'Đã thanh toán',
    PENDING: 'Đang xử lý',
    SUCCESS: 'Thành công',
    FAILED: 'Thất bại',
    CANCELLED: 'Đã hủy',
  };

  return labels[status] || status || 'Đang cập nhật';
};

export const buildPaymentResultViewModel = ({ loading, statusPayload, error }) => {
  const paymentStatus = getPaymentStatus(statusPayload);
  const orderStatus = getOrderStatus(statusPayload);
  const isPaid = Boolean(statusPayload?.is_paid);
  const isFailed = paymentStatus === 'FAILED';
  const isPending = !isPaid && paymentStatus === 'PENDING';

  if (loading) {
    return {
      tone: 'loading',
      title: 'Đang kiểm tra thanh toán',
      description: 'Hệ thống đang kiểm tra kết quả thanh toán từ VNPAY. Vui lòng chờ trong giây lát.',
      orderStatus,
      paymentStatus,
      showRetry: false,
      showRefresh: false,
    };
  }

  if (isPaid) {
    return {
      tone: 'success',
      title: 'Thanh toán thành công',
      description: 'Đơn hàng của bạn đã được ghi nhận. Cảm ơn bạn đã mua hàng tại PBL7 Medicine.',
      orderStatus,
      paymentStatus,
      showRetry: false,
      showRefresh: false,
    };
  }

  if (isFailed) {
    return {
      tone: 'failed',
      title: 'Thanh toán thất bại',
      description: 'Giao dịch VNPAY chưa hoàn tất. Bạn có thể thanh toán lại bằng chính đơn hàng này.',
      orderStatus,
      paymentStatus,
      showRetry: true,
      showRefresh: false,
    };
  }

  if (isPending) {
    return {
      tone: 'pending',
      title: 'Đang xác nhận thanh toán',
      description: 'Hệ thống đang chờ xác nhận kết quả thanh toán mới nhất. Trạng thái sẽ tự cập nhật khi có phản hồi.',
      orderStatus,
      paymentStatus,
      showRetry: false,
      showRefresh: true,
    };
  }

  return {
    tone: 'unknown',
    title: 'Chưa xác định được trạng thái thanh toán',
    description: error || 'Vui lòng kiểm tra lại đơn hàng hoặc thử thanh toán lại.',
    orderStatus,
    paymentStatus,
    showRetry: false,
    showRefresh: true,
  };
};

const resultToneStyles = {
  loading: {
    icon: <FaClock className="text-5xl text-blue-600" />,
    ring: 'bg-blue-50 text-blue-600',
    accent: 'border-blue-100 bg-blue-50 text-blue-700',
  },
  success: {
    icon: <FaCheckCircle className="text-5xl text-green-600" />,
    ring: 'bg-green-50 text-green-600',
    accent: 'border-green-100 bg-green-50 text-green-700',
  },
  failed: {
    icon: <FaExclamationTriangle className="text-5xl text-red-600" />,
    ring: 'bg-red-50 text-red-600',
    accent: 'border-red-100 bg-red-50 text-red-700',
  },
  pending: {
    icon: <FaClock className="text-5xl text-blue-600" />,
    ring: 'bg-blue-50 text-blue-600',
    accent: 'border-blue-100 bg-blue-50 text-blue-700',
  },
  unknown: {
    icon: <FaClock className="text-5xl text-gray-600" />,
    ring: 'bg-gray-50 text-gray-600',
    accent: 'border-gray-100 bg-gray-50 text-gray-700',
  },
};

const VnpayReturnScreen = () => {
  const location = useLocation();
  const history = useHistory();
  const { user } = useAuth();
  const { loadCart } = useOrder();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const orderId = query.get('order_id');
  const returnSuccess = query.get('success') === 'true';
  const [statusPayload, setStatusPayload] = useState(() => getInitialStatusFromQuery(query));
  const [pollCount, setPollCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState('');

  const fetchPaymentStatus = useCallback(async () => {
    if (!orderId) {
      setError('Không tìm thấy mã đơn hàng trong kết quả thanh toán.');
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
      setError(err?.message || 'Không thể kiểm tra trạng thái thanh toán.');
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

  const resultView = buildPaymentResultViewModel({ loading, statusPayload, error });
  const toneStyle = resultToneStyles[resultView.tone] || resultToneStyles.unknown;
  const amount = parseAmount(statusPayload?.amount || statusPayload?.payment?.amount);

  const retryPayment = () => {
    history.push('/checkout');
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-16 sm:px-6">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className={`mt-10 flex h-24 w-24 items-center justify-center rounded-full ${toneStyle.ring}`}>
            {toneStyle.icon}
          </div>
          <h1 className="mt-6 px-6 text-3xl font-bold text-gray-900">{resultView.title}</h1>
          <p className="mt-3 max-w-2xl px-6 text-base leading-7 text-gray-600">{resultView.description}</p>
        </div>

        <div className="mt-10 border-t border-gray-100 bg-gray-50 px-6 py-6 sm:px-8">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-md bg-white p-4">
              <dt className="text-sm font-semibold text-gray-500">Mã đơn hàng</dt>
              <dd className="mt-1 text-lg font-bold text-gray-900">{orderId || 'Không có'}</dd>
            </div>
            <div className="rounded-md bg-white p-4">
              <dt className="text-sm font-semibold text-gray-500">Số tiền</dt>
              <dd className="mt-1 text-lg font-bold text-blue-600">{amount ? formatCurrency(amount) : 'Đang cập nhật'}</dd>
            </div>
            <div className="rounded-md bg-white p-4">
              <dt className="text-sm font-semibold text-gray-500">Trạng thái đơn hàng</dt>
              <dd className="mt-1 text-lg font-bold text-gray-900">{getStatusLabel(resultView.orderStatus)}</dd>
            </div>
            <div className="rounded-md bg-white p-4">
              <dt className="text-sm font-semibold text-gray-500">Trạng thái thanh toán</dt>
              <dd className="mt-1 text-lg font-bold text-gray-900">{getStatusLabel(resultView.paymentStatus)}</dd>
            </div>
          </dl>

          {returnSuccess && resultView.tone === 'pending' && (
            <div className={`mt-5 rounded-md border p-4 text-sm ${toneStyle.accent}`}>
              Giao dịch đã quay về từ VNPAY. Hệ thống đang xác nhận lại trạng thái thanh toán.
            </div>
          )}

          {error && resultView.tone === 'unknown' && (
            <div className="mt-5 rounded-md border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            {resultView.showRetry && (
              <button
                type="button"
                onClick={retryPayment}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                <FaRedo />
                Thanh toán lại
              </button>
            )}
            <button
              type="button"
              onClick={() => history.push('/orders')}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-5 py-3 font-bold text-white transition hover:bg-gray-800"
            >
              <FaShoppingBag />
              Xem đơn hàng
            </button>
            <button
              type="button"
              onClick={() => history.push('/products')}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
            >
              Tiếp tục mua sắm
            </button>
            {resultView.showRefresh && (
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setPollCount(0);
                }}
                className="inline-flex items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-5 py-3 font-bold text-blue-700 transition hover:bg-blue-100"
              >
                Kiểm tra lại
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default VnpayReturnScreen;
