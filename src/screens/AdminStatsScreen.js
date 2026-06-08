import React, { useCallback, useEffect, useMemo, useState } from 'react';
import swal from 'sweetalert';
import useAuth from '../hooks/useAuth';
import { apiFetch, getAuthHeaders, getListData } from '../utils/apiClient';
import {
  buildOrderStatusSummary,
  buildRevenueSeries,
  buildTopProducts,
  calculatePaidRevenue,
} from '../utils/adminStats';

const currency = new Intl.NumberFormat('vi-VN');

const formatMoney = (value) => `${currency.format(Number(value || 0))} đ`;

const revenueRangeOptions = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'monthly', label: 'Theo tháng' },
];

const DashboardCard = ({ label, value, hint, accentClassName }) => (
  <div className={`rounded-lg border border-gray-200 bg-white p-5 shadow-sm ${accentClassName || ''}`}>
    <p className="text-sm font-semibold text-gray-500">{label}</p>
    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    {hint && <p className="mt-2 text-sm text-gray-500">{hint}</p>}
  </div>
);

const EmptyChart = ({ text }) => (
  <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm font-medium text-gray-500">
    {text}
  </div>
);

const getOrderId = (order) => order?.order_id ?? order?.id;

const hasOrderItems = (order) => Array.isArray(order?.items) && order.items.length > 0;

const enrichPaidOrdersWithDetails = async (orders, headers) => {
  const detailRequests = orders.map(async (order) => {
    const orderId = getOrderId(order);

    if (order.status !== 'PAID' || !orderId || hasOrderItems(order)) {
      return order;
    }

    try {
      const detail = await apiFetch(`/order/admin/${orderId}/details`, { headers });
      const detailItems = Array.isArray(detail?.items) ? detail.items : [];
      return { ...order, ...detail, items: detailItems };
    } catch (error) {
      console.warn(`Không tải được chi tiết đơn hàng ${orderId}:`, error);
      return order;
    }
  });

  return Promise.all(detailRequests);
};

const RevenueChart = ({ series, range, onRangeChange }) => {
  const data = series.points;
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 0);
  const maxChartValue = Math.max(maxRevenue, 1);
  const shouldShowEveryLabel = range !== '30d';
  const visibleLabelStep = range === '30d' ? 5 : 1;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Biểu đồ doanh thu</h2>
          <p className="mt-1 text-sm text-gray-500">Chỉ tính các đơn hàng đã PAID trong khoảng đang chọn.</p>
        </div>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          {revenueRangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onRangeChange(option.value)}
              className={`rounded-md px-3 py-2 text-sm font-bold transition ${
                range === option.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-xs font-bold uppercase text-blue-700">Tổng doanh thu</p>
          <p className="mt-1 text-xl font-bold text-blue-900">{formatMoney(series.totalRevenue)}</p>
        </div>
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-xs font-bold uppercase text-green-700">Đơn PAID</p>
          <p className="mt-1 text-xl font-bold text-green-900">{series.totalOrders} đơn</p>
        </div>
        <div className="rounded-lg bg-indigo-50 p-4">
          <p className="text-xs font-bold uppercase text-indigo-700">Cao nhất</p>
          <p className="mt-1 text-xl font-bold text-indigo-900">
            {series.bestPoint.revenue > 0 ? series.bestPoint.label : 'Chưa có'}
          </p>
          <p className="text-xs font-semibold text-indigo-700">{formatMoney(series.bestPoint.revenue)}</p>
        </div>
      </div>

      {series.totalRevenue === 0 ? (
        <EmptyChart text="Chưa có đơn đã thanh toán để vẽ biểu đồ." />
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: range === '30d' ? 860 : 0 }}>
            <div className="relative flex h-72 items-end gap-2 border-b border-l border-gray-200 px-3 pt-8">
              <div className="pointer-events-none absolute inset-x-3 top-8 bottom-0 flex flex-col justify-between">
                {[0, 1, 2, 3].map((line) => (
                  <div key={line} className="border-t border-dashed border-gray-200" />
                ))}
              </div>
            {data.map((item) => {
              const height = item.revenue > 0 ? Math.max(8, (item.revenue / maxChartValue) * 100) : 2;

              return (
                <div key={item.key} className="relative z-10 flex min-w-0 flex-1 flex-col items-center justify-end">
                  {item.revenue > 0 && (
                    <div className="mb-2 whitespace-nowrap text-center text-xs font-semibold text-gray-700">
                      {formatMoney(item.revenue)}
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t-md transition ${
                      item.revenue > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-200'
                    }`}
                    style={{ height: `${height}%`, minHeight: item.revenue > 0 ? 12 : 4 }}
                    title={`${item.label}: ${formatMoney(item.revenue)} (${item.orders} đơn)`}
                  />
                </div>
              );
            })}
            </div>
            <div className="mt-3 flex gap-2 px-3">
            {data.map((item) => (
              <div key={item.key} className="min-w-0 flex-1 text-center">
                <p className="truncate text-xs font-bold text-gray-700">
                  {shouldShowEveryLabel || data.indexOf(item) % visibleLabelStep === 0 ? item.label : ''}
                </p>
                <p className="text-xs text-gray-500">{item.orders > 0 ? `${item.orders} đơn` : ''}</p>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBreakdown = ({ summary }) => {
  const items = [
    { key: 'PENDING', label: 'Chờ xử lý', value: summary.PENDING || 0, color: 'bg-yellow-500' },
    { key: 'PAID', label: 'Đã thanh toán', value: summary.PAID || 0, color: 'bg-green-600' },
    { key: 'CANCELLED', label: 'Đã hủy', value: summary.CANCELLED || 0, color: 'bg-red-500' },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Trạng thái đơn hàng</h2>
        <p className="mt-1 text-sm text-gray-500">Tỷ lệ thanh toán: {summary.paidRate}%</p>
      </div>

      <div className="space-y-5">
        {items.map((item) => {
          const percent = summary.total > 0 ? Math.round((item.value / summary.total) * 100) : 0;

          return (
            <div key={item.key}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-bold text-gray-800">{item.label}</span>
                <span className="font-semibold text-gray-600">{item.value} đơn · {percent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TopProductsChart = ({ products }) => {
  const maxRevenue = Math.max(...products.map((item) => item.revenue), 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">Sản phẩm có doanh thu cao</h2>
        <p className="mt-1 text-sm text-gray-500">
          Group theo sản phẩm, giữ riêng số lượng theo từng đơn vị tính.
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyChart text="Chưa có dữ liệu sản phẩm từ đơn đã thanh toán." />
      ) : (
        <div className="space-y-4">
          {products.map((product, index) => {
            const percent = maxRevenue > 0 ? Math.max(8, (product.revenue / maxRevenue) * 100) : 0;
            const unitText = product.unitBreakdown
              .filter((unit) => unit.quantity > 0)
              .map((unit) => `${unit.quantity} ${unit.unitName}`)
              .join(', ');

            return (
              <div key={product.key || product.name}>
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {index + 1}. {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {unitText || `${product.totalLines} dòng sản phẩm`}
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">
                    {formatMoney(product.revenue)}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: `${percent}%` }} />
                </div>
                <p className="mt-1 text-xs font-semibold text-gray-500">
                  {product.totalLines} dòng bán trong đơn PAID
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const AdminStatsScreen = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [revenueRange, setRevenueRange] = useState('7d');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders(null);
      const [ordersPayload, usersPayload, messagesPayload] = await Promise.all([
        apiFetch('/order/admin?page=1&limit=100', { headers }),
        apiFetch('/user?page=1&limit=100', { headers }),
        apiFetch('/doctor/messages/all', { headers }),
      ]);

      const orderList = getListData(ordersPayload);
      const enrichedOrders = await enrichPaidOrdersWithDetails(orderList, headers);

      setOrders(enrichedOrders);
      setUsers(getListData(usersPayload));
      setMessages(getListData(messagesPayload));
    } catch (err) {
      swal('Error', 'Không tải được dữ liệu thống kê', 'error');
      setOrders([]);
      setUsers([]);
      setMessages([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
  }, [isAdmin, loadAll]);

  const stats = useMemo(() => {
    const statusSummary = buildOrderStatusSummary(orders);
    const revenueSeries = buildRevenueSeries(orders, revenueRange);
    const topProducts = buildTopProducts(orders, 5);
    const adminCount = users.filter((item) => item.role === 'ADMIN').length;
    const customerCount = users.filter((item) => item.role === 'CUSTOMER').length;
    const unrepliedMessages = messages.filter((item) => !item.doctorReply).length;

    return {
      totalRevenue: calculatePaidRevenue(orders),
      statusSummary,
      revenueSeries,
      topProducts,
      adminCount,
      customerCount,
      unrepliedMessages,
    };
  }, [orders, users, messages, revenueRange]);

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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Statistics</h1>
            <p className="mt-2 text-gray-500">
              Theo dõi doanh thu, trạng thái đơn và sản phẩm nổi bật trong một màn hình.
            </p>
          </div>
          <button
            type="button"
            onClick={loadAll}
            className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Refresh'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            label="Tổng đơn hàng"
            value={orders.length}
            hint={`${stats.statusSummary.PENDING || 0} đơn đang chờ xử lý`}
            accentClassName="border-t-4 border-blue-600"
          />
          <DashboardCard
            label="Doanh thu đã thanh toán"
            value={formatMoney(stats.totalRevenue)}
            hint={`${stats.statusSummary.PAID || 0} đơn PAID`}
            accentClassName="border-t-4 border-green-600"
          />
          <DashboardCard
            label="Tỷ lệ thanh toán"
            value={`${stats.statusSummary.paidRate}%`}
            hint={`${stats.statusSummary.PAID || 0}/${stats.statusSummary.total} đơn hoàn tất`}
            accentClassName="border-t-4 border-indigo-600"
          />
          <DashboardCard
            label="Khách hàng"
            value={stats.customerCount}
            hint={`${stats.adminCount} admin đang quản lý`}
            accentClassName="border-t-4 border-purple-600"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RevenueChart
              series={stats.revenueSeries}
              range={revenueRange}
              onRangeChange={setRevenueRange}
            />
          </div>
          <StatusBreakdown summary={stats.statusSummary} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TopProductsChart products={stats.topProducts} />
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Việc cần chú ý</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-lg bg-yellow-50 p-4">
                <p className="text-sm font-bold text-yellow-800">Đơn chờ xử lý</p>
                <p className="mt-1 text-2xl font-bold text-yellow-700">
                  {stats.statusSummary.PENDING || 0}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-4">
                <p className="text-sm font-bold text-emerald-800">Tin nhắn tư vấn</p>
                <p className="mt-1 text-2xl font-bold text-emerald-700">{messages.length}</p>
                <p className="mt-1 text-sm text-emerald-700">
                  Chưa trả lời: {stats.unrepliedMessages}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                Ưu tiên kiểm tra đơn PENDING trước, sau đó xử lý các tin nhắn chưa phản hồi.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatsScreen;
