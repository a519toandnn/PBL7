const KNOWN_STATUSES = ['PENDING', 'PAID', 'CANCELLED'];

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const isPaidOrder = (order) => order?.status === 'PAID';

const getOrderAmount = (order) => toNumber(order?.total_amount ?? order?.totalAmount ?? order?.amount);

const formatDateLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const getDayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

const getMonthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;

const formatMonthLabel = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${month}/${date.getFullYear()}`;
};

const createDateAtNoon = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);

const createDayPoint = (date) => ({
  key: getDayKey(date),
  label: formatDateLabel(date),
  revenue: 0,
  orders: 0,
});

const createMonthPoint = (date) => ({
  key: getMonthKey(date),
  label: formatMonthLabel(date),
  revenue: 0,
  orders: 0,
});

const getPaidOrderDate = (order) => {
  const date = new Date(order?.paid_at || order?.created_at);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeProductName = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ');

export const calculatePaidRevenue = (orders = []) => {
  return orders
    .filter(isPaidOrder)
    .reduce((sum, order) => sum + getOrderAmount(order), 0);
};

export const buildRevenueSeries = (orders = [], range = '7d', referenceDate = new Date()) => {
  const normalizedRange = ['7d', '30d', 'monthly'].includes(range) ? range : '7d';
  const isMonthly = normalizedRange === 'monthly';
  const pointCount = normalizedRange === '30d' ? 30 : isMonthly ? 12 : 7;
  const endDate = createDateAtNoon(referenceDate);
  const points = [];

  for (let index = pointCount - 1; index >= 0; index -= 1) {
    const date = isMonthly
      ? new Date(endDate.getFullYear(), endDate.getMonth() - index, 1, 12)
      : new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - index, 12);
    points.push(isMonthly ? createMonthPoint(date) : createDayPoint(date));
  }

  const pointMap = new Map(points.map((point) => [point.key, { ...point }]));

  orders.filter(isPaidOrder).forEach((order) => {
    const orderDate = getPaidOrderDate(order);
    if (!orderDate) return;

    const key = isMonthly ? getMonthKey(orderDate) : getDayKey(orderDate);
    const current = pointMap.get(key);
    if (!current) return;

    pointMap.set(key, {
      ...current,
      revenue: current.revenue + getOrderAmount(order),
      orders: current.orders + 1,
    });
  });

  const seriesPoints = points.map((point) => pointMap.get(point.key) || point);
  const totalRevenue = seriesPoints.reduce((sum, point) => sum + point.revenue, 0);
  const totalOrders = seriesPoints.reduce((sum, point) => sum + point.orders, 0);
  const bestPoint = seriesPoints.reduce((best, point) => (
    point.revenue > best.revenue ? point : best
  ), { key: '', label: 'Không có', revenue: 0, orders: 0 });

  return {
    range: normalizedRange,
    points: seriesPoints,
    totalRevenue,
    totalOrders,
    bestPoint,
  };
};

export const buildDailyRevenue = (orders = []) => {
  const revenueMap = new Map();

  orders.filter(isPaidOrder).forEach((order) => {
    const dateValue = order.paid_at || order.created_at;
    const label = formatDateLabel(dateValue);
    if (!label) return;

    const date = new Date(dateValue);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const sortKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const current = revenueMap.get(key) || { date: label, revenue: 0, orders: 0, sortKey };
    revenueMap.set(key, {
      ...current,
      revenue: current.revenue + getOrderAmount(order),
      orders: current.orders + 1,
    });
  });

  return Array.from(revenueMap.values())
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ sortKey, ...item }) => item);
};

export const buildOrderStatusSummary = (orders = []) => {
  const summary = KNOWN_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {});

  orders.forEach((order) => {
    const status = order?.status;
    if (!status) return;
    summary[status] = (summary[status] || 0) + 1;
  });

  const total = orders.length;
  const paidRate = total > 0 ? Math.round(((summary.PAID || 0) / total) * 100) : 0;

  return {
    ...summary,
    total,
    paidRate,
  };
};

export const buildTopProducts = (orders = [], limit = 5) => {
  const productMap = new Map();

  orders.filter(isPaidOrder).forEach((order) => {
    const items = Array.isArray(order.items) ? order.items : [];

    items.forEach((item) => {
      const name = item.product_name || item.product_name_snapshot || item.name || item.product?.name;
      if (!name) return;

      const productId = item.product_id ?? item.productId ?? item.product?.id;
      const key = productId ? `product:${productId}` : `name:${normalizeProductName(name)}`;
      const quantity = Math.max(0, toNumber(item.quantity));
      const explicitRevenue = toNumber(item.subtotal ?? item.total_price);
      const unitRevenue = toNumber(item.unit_price) * quantity;
      const itemRevenue = explicitRevenue || unitRevenue;
      const unitName = item.unit_name || item.measure_unit_name || item.measure_name || 'Không rõ';
      const current = productMap.get(key) || {
        key,
        name,
        revenue: 0,
        totalLines: 0,
        unitMap: new Map(),
      };
      const currentUnitQuantity = current.unitMap.get(unitName) || 0;
      current.unitMap.set(unitName, currentUnitQuantity + quantity);

      productMap.set(key, {
        ...current,
        name,
        revenue: current.revenue + itemRevenue,
        totalLines: current.totalLines + 1,
      });
    });
  });

  return Array.from(productMap.values())
    .map((product) => ({
      key: product.key,
      name: product.name,
      revenue: product.revenue,
      totalLines: product.totalLines,
      unitBreakdown: Array.from(product.unitMap.entries()).map(([unitName, quantity]) => ({
        unitName,
        quantity,
      })),
    }))
    .sort((a, b) => b.revenue - a.revenue || b.totalLines - a.totalLines)
    .slice(0, limit);
};
