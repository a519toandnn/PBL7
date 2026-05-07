import React, { useEffect, useMemo, useState } from 'react';
import swal from 'sweetalert';
import useAuth from '../hooks/useAuth';

const AdminStatsScreen = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ordersRes, usersRes, messagesRes] = await Promise.all([
        fetch(`${apiBase}/order`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/user`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/doctor/messages/all`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [ordersJson, usersJson, messagesJson] = await Promise.all([
        ordersRes.json(),
        usersRes.json(),
        messagesRes.json(),
      ]);

      setOrders(Array.isArray(ordersJson.data || ordersJson) ? (ordersJson.data || ordersJson) : []);
      setUsers(Array.isArray(usersJson.data || usersJson) ? (usersJson.data || usersJson) : []);
      setMessages(Array.isArray(messagesJson.data || messagesJson) ? (messagesJson.data || messagesJson) : []);
    } catch (err) {
      swal('Error', 'Không tải được dữ liệu thống kê', 'error');
      setOrders([]);
      setUsers([]);
      setMessages([]);
    }
    setLoading(false);
  };

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const byStatus = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const adminCount = users.filter((u) => u.role === 'ADMIN').length;
    const customerCount = users.filter((u) => u.role === 'CUSTOMER').length;
    const unrepliedMessages = messages.filter((m) => !m.doctorReply).length;

    return {
      totalRevenue,
      byStatus,
      adminCount,
      customerCount,
      unrepliedMessages,
    };
  }, [orders, users, messages]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only admins can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <h1 className="text-4xl font-bold text-gray-900">Admin Statistics</h1>
          <button
            onClick={loadAll}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
          >
            {loading ? 'Đang tải...' : 'Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-600">
            <p className="text-gray-600 text-sm">Tổng đơn hàng</p>
            <p className="text-3xl font-bold text-blue-700">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-600">
            <p className="text-gray-600 text-sm">Doanh thu (PAID)</p>
            <p className="text-3xl font-bold text-green-700">
              {Number(stats.totalRevenue).toLocaleString()} đ
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-indigo-600">
            <p className="text-gray-600 text-sm">Customers</p>
            <p className="text-3xl font-bold text-indigo-700">{stats.customerCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-600">
            <p className="text-gray-600 text-sm">Admins</p>
            <p className="text-3xl font-bold text-purple-700">{stats.adminCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-yellow-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">PENDING</p>
            <p className="text-3xl font-bold text-yellow-700">{stats.byStatus.PENDING || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">PAID</p>
            <p className="text-3xl font-bold text-green-700">{stats.byStatus.PAID || 0}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">CANCELLED</p>
            <p className="text-3xl font-bold text-red-700">{stats.byStatus.CANCELLED || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-emerald-600">
            <p className="text-gray-600 text-sm">Tin nhắn tư vấn</p>
            <p className="text-3xl font-bold text-emerald-700">{messages.length}</p>
            <p className="text-sm text-gray-500 mt-2">Chưa trả lời: {stats.unrepliedMessages}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-gray-800">
            <p className="text-gray-600 text-sm">Gợi ý</p>
            <ul className="mt-2 text-gray-700 list-disc pl-5 space-y-1">
              <li>Ưu tiên trả lời các tin nhắn chưa phản hồi.</li>
              <li>Kiểm tra đơn PENDING và xử lý thanh toán.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsScreen;

