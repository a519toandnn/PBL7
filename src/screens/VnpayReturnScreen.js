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
    if (loading) return 'Đang kiểm tra thanh toán';
    if (isPaid) return 'Thanh toán thành công';
    if (isFailed) return 'Thanh toán thất bại';
    if (isPending) return 'Đang xác nhận thanh toán';
    return 'Chưa xác định được trạng thái thanh toán';
  })();

  const description = (() => {
    if (loading) return 'FE đang gọi BE để lấy trạng thái đơn hàng sau khi VNPAY redirect về.';
    if (isPaid) return 'BE đã xác nhận thanh toán thành công và đơn hàng đã được cập nhật.';
    if (isFailed) return 'Giao dịch VNPAY thất bại hoặc đã bị hủy. Bạn có thể thanh toán lại bằng chính đơn hàng này.';
    if (isPending) return 'BE đã nhận ReturnURL và FE đang kiểm tra lại trạng thái thanh toán mới nhất.';
    return error || 'Vui lòng kiểm tra lại đơn hàng hoặc thử thanh toán lại.';
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
              <dt className="text-sm font-semibold text-gray-500">Mã đơn hàng</dt>
              <dd className="mt-1 font-bold text-gray-900">{orderId || 'Không có'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500">Số tiền</dt>
              <dd className="mt-1 font-bold text-blue-600">{amount ? formatCurrency(amount) : 'Đang cập nhật'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500">Trang thai đơn hàng</dt>
              <dd className="mt-1 font-bold text-gray-900">{orderStatus || 'Đang cập nhật'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500">Trang thai thanh toan</dt>
              <dd className="mt-1 font-bold text-gray-900">{paymentStatus || 'Đang cập nhật'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500">VNPAY response</dt>
              <dd className="mt-1 font-bold text-gray-900">{responseCode || 'Không có'}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-gray-500">VNPAY transaction</dt>
              <dd className="mt-1 font-bold text-gray-900">{transactionStatus || 'Không có'}</dd>
            </div>
          </dl>
        </div>

        {returnSuccess && isPending && (
          <div className="mt-5 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
            VNPAY ReturnURL hợp lệ. FE đang gọi BE để xác nhận trạng thái đơn hàng chính xác.
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
              Thanh toán lại
            </button>
          )}
          <button
            type="button"
            onClick={() => history.push('/orders')}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-3 font-bold text-gray-700 hover:bg-gray-50"
          >
            <FaShoppingBag />
            Xem đơn hàng
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
              Kiểm tra lại
            </button>
          )}
        </div>
      </section>
    </main>
  );
};

export default VnpayReturnScreen;
