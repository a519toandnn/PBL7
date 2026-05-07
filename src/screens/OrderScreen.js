import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Bounce from 'react-reveal/Bounce';
import swal from 'sweetalert';
import OrderCard from '../components/Order/OrderCard';
import useOrder from '../hooks/useOrder';
import useAuth from '../hooks/useAuth';

const OrderScreen = () => {
  const { orders } = useOrder();
  const { user } = useAuth();
  const history = useHistory();
  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  const [historyOrders, setHistoryOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const cartTotal = useMemo(() => {
    return orders.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
  }, [orders]);

  useEffect(() => {
    if (!user?.id) return;
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/order/user/${user.id}`, {
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
        .map((i) => `${i.product_name} x${i.quantity} (${Number(i.unit_price).toLocaleString()} đ)`)
        .join('\n');

      swal({
        title: payload?.order_no || `Order ${orderId}`,
        text:
          `Trạng thái: ${payload?.status}\n` +
          `Tổng: ${Number(payload?.total_amount || 0).toLocaleString()} đ\n\n` +
          `Sản phẩm:\n${itemsList || '(không có)'}\n\n` +
          `Ghi chú: ${payload?.note || '(không có)'}`,
        icon: 'info',
      });
    } catch (err) {
      swal('Error', 'Không tải được chi tiết đơn hàng', 'error');
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Giỏ hàng</h2>

        {orders.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-gray-600">
            Giỏ hàng trống.
            <button
              onClick={() => history.push('/products')}
              className="ml-3 text-blue-600 hover:underline"
            >
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex flex-col space-y-4 w-full max-w-2xl">
              {orders.map((item) => (
                <OrderCard key={item.id} {...item} />
              ))}

              <div className="mt-4 bg-gray-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Subtotal:</h2>
                  <h2 className="text-3xl font-bold text-blue-600">
                    {cartTotal.toLocaleString()} đ
                  </h2>
                </div>
                <button
                  onClick={() => history.push('/checkout')}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
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
                  {historyOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{o.order_no}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {o.created_at ? new Date(o.created_at).toLocaleString() : ''}
                      </td>
                      <td className="px-6 py-4 text-gray-700">{o.status}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {Number(o.total_amount || 0).toLocaleString()} đ
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => viewOrderDetails(o.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
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

