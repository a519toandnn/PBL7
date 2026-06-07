import React, { useEffect, useMemo, useState } from 'react';
import { BsCheck, BsTrash } from 'react-icons/bs';
import { useHistory } from 'react-router-dom';
import Bounce from 'react-reveal/Bounce';
import swal from 'sweetalert';
import OrderCard from '../components/Order/OrderCard';
import useOrder from '../hooks/useOrder';
import useAuth from '../hooks/useAuth';
import { formatCurrency, needsPriceConsultation } from '../utils/productsApi';

const formatOrderShippingAddress = (address) => {
  if (!address) return '(Không có)';

  return [
    `Người nhận: ${address.receiver_name || '(Không có)'}`,
    `Số điện thoại: ${address.receiver_phone || '(Không có)'}`,
    `Địa chỉ: ${[address.address_line, address.ward, address.province].filter(Boolean).join(', ') || '(Không có)'}`,
  ].join('\n') || '(Không có)';
};

const formatOrderNote = (note) => note || '(Không có)';

const getOrderId = (order) => order?.order_id ?? order?.id;

const getLatestPayment = (order) => {
  const payments = Array.isArray(order?.payments) ? order.payments : [];
  return [...payments].sort((left, right) => {
    const rightId = Number(right.payment_id ?? right.id ?? 0);
    const leftId = Number(left.payment_id ?? left.id ?? 0);
    return rightId - leftId;
  })[0] || null;
};

const getPaymentMethodCode = (payment) => {
  return (
    payment?.payment_method_code ||
    payment?.method?.code ||
    payment?.payment_method?.code ||
    payment?.payment_method_name ||
    payment?.method?.name ||
    payment?.payment_method?.name ||
    ''
  );
};

const canContinueVnpayPayment = (order) => {
  if (order?.status !== 'PENDING') return false;

  const latestPayment = getLatestPayment(order);
  const methodCode = String(getPaymentMethodCode(latestPayment)).toUpperCase();
  const paymentStatus = latestPayment?.status;

  return methodCode.includes('VNPAY') && ['PENDING', 'FAILED'].includes(paymentStatus);
};

const OrderScreen = () => {
  const { orders, selectedCheckoutIds, setSelectedCheckoutIds, clearOrders } = useOrder();
  const { user } = useAuth();
  const history = useHistory();
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState(null);

  const cartTotal = useMemo(() => {
    return orders
      .filter((item) => selectedCheckoutIds.includes(item.cartKey))
      .reduce((sum, item) => {
      if (needsPriceConsultation(item.price)) return sum;
      return sum + (Number(item.price) * (item.quantity || 1));
    }, 0);
  }, [orders, selectedCheckoutIds]);

  const cartKeys = useMemo(() => orders.map((item) => item.cartKey), [orders]);
  const allSelected = orders.length > 0 && selectedCheckoutIds.length === orders.length;
  const selectedCount = selectedCheckoutIds.length;

  const toggleSelectAll = () => {
    setSelectedCheckoutIds(allSelected ? [] : cartKeys);
  };

  const toggleSelectItem = (itemId) => {
    setSelectedCheckoutIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const proceedToCheckout = () => {
    if (selectedCheckoutIds.length === 0) {
      swal('Error', 'Vui lòng chọn ít nhất một sản phẩm để checkout', 'error');
      return;
    }

    history.push('/checkout');
  };

  const clearAllCart = async () => {
    const willClear = await swal({
      title: 'Xóa toàn bộ giỏ hàng?',
      text: 'Tất cả sản phẩm trong giỏ hàng sẽ bị xóa.',
      icon: 'warning',
      buttons: true,
      dangerMode: true,
    });

    if (!willClear) return;

    try {
      await clearOrders();
      swal('Success', 'Đã xóa toàn bộ giỏ hàng', 'success');
    } catch (error) {
      swal('Error', error.message || 'Không thể xóa giỏ hàng', 'error');
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadHistory = async () => {
    setLoading(true);
    try {
// lấy ds đơn hàng user lần đầu (sau đó có thể refresh bằng nút) - ⭐ NEW: thêm timeout tránh treo UI nếu API chậm hoặc lỗi
      const res = await fetch(`${apiBase}/order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const payload = json.data || json;
      setHistoryOrders(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setHistoryOrders([]);
    }
    setLoading(false);
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const res = await fetch(`${apiBase}/order/${orderId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const payload = json.data || json;

      const items = Array.isArray(payload?.items) ? payload.items : [];
      const itemsList = items
        .map((i) => `${i.product_name || i.product_name_snapshot || '(Không có)'} x${i.quantity} (${needsPriceConsultation(i.unit_price) ? 'Cần tư vấn từ dược sĩ' : formatCurrency(i.unit_price)})`)
        .join('\n');

      const orderDetailText = [
        `Trạng thái: ${payload?.status}`,
        `Tổng: ${formatCurrency(payload?.total_amount || 0)}`,
        '',
        `Địa chỉ giao hàng:\n${formatOrderShippingAddress(payload?.shipping_address)}`,
        '',
        `Sản phẩm:\n${itemsList || '(Không có)'}`,
        '',
        `Ghi chú: ${formatOrderNote(payload?.note)}`,
      ].join('\n');

      swal({
        title: payload?.order_no || `Order ${orderId}`,
        text: orderDetailText,
        icon: 'info',
      });
    } catch (err) {
      swal('Error', 'Không tải được chi tiết đơn hàng', 'error');
    }
  };

  const continueVnpayPayment = async (orderId) => {
    if (!orderId) return;

    setPayingOrderId(orderId);

    try {
      const res = await fetch(`${apiBase}/payment/order/${orderId}/initiate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payment_method_code: 'VNPAY' }),
      });

      const json = await res.json().catch(() => null);
      const payload = json?.data || json;

      if (!res.ok) {
        throw new Error(json?.message || 'Không thể tiếp tục thanh toán VNPAY');
      }

      const paymentUrl = payload?.next_action?.payment_url;

      if (payload?.next_action?.type === 'REDIRECT' && paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      if (payload?.payment?.status === 'SUCCESS') {
        await loadHistory();
        swal('Thanh toán thành công', 'Đơn hàng đã được cập nhật.', 'success');
        return;
      }

      swal('Chưa thể mở VNPAY', payload?.message || 'Vui lòng thử lại.', 'warning');
    } catch (error) {
      swal('Lỗi thanh toán', error.message || 'Không thể tiếp tục thanh toán.', 'error');
    } finally {
      setPayingOrderId(null);
    }
  };

  return (
    <section className="max-w-screen-xl py-24 mx-auto px-6">
      <Bounce left>
        <div className="flex flex-col items-center space-x-2 pb-8">
          <h1 className="text-gray-700 poppins text-3xl">
            My <span className="text-blue-600 font-semibold select-none">Orders</span>
          </h1>
          <div className="bg-blue-600 flex items-center justify-center w-16 h-1 mt-2 rounded-full" />
        </div>
      </Bounce>

      {/* Cart */}
      <div className="mb-12">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Cart</h2>
            {orders.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {selectedCount}/{orders.length} items selected
              </p>
            )}
          </div>
          {orders.length > 0 && (
            <button
              type="button"
              onClick={clearAllCart}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 hover:border-red-300"
            >
              <BsTrash />
              Clear all
            </button>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
            Your cart is empty.
            <button
              onClick={() => history.push('/products')}
              className="ml-3 text-blue-600 hover:underline"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex flex-col space-y-3 w-full max-w-3xl">
              <label className="flex items-center justify-between gap-3 px-1 py-2 text-sm font-semibold text-gray-700">
                <span className="flex items-center gap-3">
                  <span className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="sr-only"
                    />
                    <span className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      allSelected
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-gray-300'
                    }`}>
                      {allSelected && <BsCheck className="text-lg" />}
                    </span>
                  </span>
                  Select all
                </span>
                <span className="text-gray-400 font-medium">{orders.length} item</span>
              </label>

              {orders.map((item) => (
                <OrderCard
                  key={item.cartKey}
                  {...item}
                  selected={selectedCheckoutIds.includes(item.cartKey)}
                  onSelect={() => toggleSelectItem(item.cartKey)}
                />
              ))}

              <div className="mt-2">
                <div className="flex justify-between items-end mb-3 px-1">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Subtotal</h2>
                    <p className="text-sm text-gray-500">{selectedCount} items selected</p>
                  </div>
                  <h2 className="text-2xl font-bold text-blue-600">
                    {formatCurrency(cartTotal)}
                  </h2>
                </div>
                <button
                  onClick={proceedToCheckout}
                  disabled={selectedCount === 0}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Lịch sử mua hàng</h2>
          <button
            onClick={loadHistory}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
          >
            {loading ? 'Đang tải...' : 'Refresh'}
          </button>
        </div>

        {historyOrders.length === 0 ? (
          <div className="bg-white border rounded-lg p-6 text-gray-600">
            Chưa có đơn hàng nào.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">Order No</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Total</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historyOrders.map((o) => {
                    const orderId = getOrderId(o);

                    return (
                    <tr key={orderId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{o.order_no}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {o.created_at ? new Date(o.created_at).toLocaleString() : ''}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{o.status}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {formatCurrency(o.total_amount || 0)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => viewOrderDetails(orderId)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Chi tiết
                        </button>
                        {canContinueVnpayPayment(o) && (
                          <button
                            type="button"
                            onClick={() => continueVnpayPayment(orderId)}
                            disabled={payingOrderId === orderId}
                            className="ml-0 mt-2 sm:ml-3 sm:mt-0 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {payingOrderId === orderId ? 'Đang mở VNPAY...' : 'Tiếp tục thanh toán'}
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default OrderScreen;
