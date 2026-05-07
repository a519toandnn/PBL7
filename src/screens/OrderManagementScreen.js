import React, { useEffect, useMemo, useState } from 'react';
import { AiFillDelete } from 'react-icons/ai';
import { BsEye } from 'react-icons/bs';
import swal from 'sweetalert';
import useAuth from '../hooks/useAuth';

const OrderManagementScreen = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(false);

  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!isAdmin) return;
    loadOrders();
  }, [isAdmin]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const payload = json.data || json;
      setOrders(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Error loading orders:', err);
      setOrders([]);
    }
    setLoading(false);
  };

  const getStatusLabel = (status) => {
    const map = {
      ALL: 'Tất cả',
      PENDING: 'Chờ thanh toán',
      PAID: 'Đã thanh toán',
      CANCELLED: 'Đã hủy',
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = useMemo(() => {
    if (filterStatus === 'ALL') return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${apiBase}/order/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        swal('Error', json.message || 'Update failed', 'error');
        return;
      }
      const updated = json.data || json;
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      swal('Success', 'Order status updated', 'success');
    } catch (err) {
      swal('Error', 'Network error while updating order', 'error');
    }
  };

  const deleteOrder = (orderId) => {
    swal({
      title: 'Xóa đơn hàng?',
      text: 'Đơn hàng sẽ bị xóa vĩnh viễn',
      icon: 'warning',
      buttons: true,
      dangerMode: true,
    }).then(async (willDelete) => {
      if (!willDelete) return;
      try {
        const res = await fetch(`${apiBase}/order/${orderId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) {
          swal('Error', json.message || 'Delete failed', 'error');
          return;
        }
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        swal('Success', 'Order deleted successfully', 'success');
      } catch (err) {
        swal('Error', 'Network error while deleting order', 'error');
      }
    });
  };

  const viewOrderDetails = async (order) => {
    try {
      const res = await fetch(`${apiBase}/order/${order.id}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const payload = json.data || json;

      const items = Array.isArray(payload?.items) ? payload.items : [];
      const itemsList = items
        .map((i) => `${i.product_name} x${i.quantity} (${Number(i.unit_price).toLocaleString()} đ)`)
        .join('\n');

      swal({
        title: payload?.order_no || order.order_no,
        text:
          `Khách hàng: ${payload?.user_name || order.user?.full_name || '(không rõ)'}\n` +
          `Trạng thái: ${payload?.status || order.status}\n` +
          `Tổng: ${Number(payload?.total_amount || order.total_amount || 0).toLocaleString()} đ\n\n` +
          `Sản phẩm:\n${itemsList || '(không có)'}\n\n` +
          `Ghi chú: ${payload?.note || '(không có)'}`,
        icon: 'info',
      });
    } catch (err) {
      swal('Error', 'Không tải được chi tiết đơn hàng', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only admins can access order management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <h1 className="text-4xl font-bold text-gray-900">Order Management</h1>
          <button
            onClick={loadOrders}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
          >
            {loading ? 'Đang tải...' : 'Refresh'}
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-8 flex-wrap">
          {['ALL', 'PENDING', 'PAID', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-600'
              }`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Order No</th>
                  <th className="px-6 py-4 text-left">Customer</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Total</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900">{order.order_no}</td>
                    <td className="px-6 py-4 text-gray-600">{order.user?.full_name || '(N/A)'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {Number(order.total_amount || 0).toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-semibold border-0 cursor-pointer ${getStatusColor(
                          order.status,
                        )}`}
                      >
                        <option value="PENDING">Chờ thanh toán</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="CANCELLED">Đã hủy</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="text-blue-600 hover:text-blue-800 mr-4 text-xl"
                        title="View Details"
                      >
                        <BsEye />
                      </button>
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="text-red-600 hover:text-red-800 text-xl"
                        title="Delete"
                      >
                        <AiFillDelete />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrders.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No orders found</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">Total Orders</p>
            <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">
              {orders.filter((o) => o.status === 'PENDING').length}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">Paid</p>
            <p className="text-3xl font-bold text-green-600">
              {orders.filter((o) => o.status === 'PAID').length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">Cancelled</p>
            <p className="text-3xl font-bold text-red-600">
              {orders.filter((o) => o.status === 'CANCELLED').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagementScreen;

