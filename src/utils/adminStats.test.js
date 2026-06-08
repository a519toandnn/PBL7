import {
  buildDailyRevenue,
  buildOrderStatusSummary,
  buildRevenueSeries,
  buildTopProducts,
  calculatePaidRevenue,
} from './adminStats';

describe('admin stats dashboard helpers', () => {
  const orders = [
    {
      status: 'PAID',
      total_amount: '120000.00',
      paid_at: '2026-06-07T08:05:00.000Z',
      items: [
        {
          product_id: 10,
          product_name: 'Thuoc A',
          quantity: 1,
          unit_name: 'Hộp',
          subtotal: '120000.00',
        },
        {
          product_id: 20,
          product_name: 'Thuoc B',
          quantity: 1,
          unit_name: 'Viên',
          subtotal: '30000.00',
        },
      ],
    },
    {
      status: 'PENDING',
      total_amount: '90000.00',
      created_at: '2026-06-08T08:00:00.000Z',
      items: [{ product_name: 'Thuoc C', quantity: 3 }],
    },
    {
      status: 'PAID',
      total_amount: '50000.00',
      created_at: '2026-06-08T09:00:00.000Z',
      items: [{
        product_id: 10,
        product_name_snapshot: 'Thuoc A',
        quantity: 4,
        unit_name: 'Viên',
        unit_price: '12500.00',
      }],
    },
  ];

  it('calculates revenue from paid orders only', () => {
    expect(calculatePaidRevenue(orders)).toBe(170000);
  });

  it('groups paid revenue by payment or created date', () => {
    expect(buildDailyRevenue(orders)).toEqual([
      { date: '07/06', revenue: 120000, orders: 1 },
      { date: '08/06', revenue: 50000, orders: 1 },
    ]);
  });

  it('counts order statuses and completion rate', () => {
    expect(buildOrderStatusSummary(orders)).toEqual({
      PENDING: 1,
      PAID: 2,
      CANCELLED: 0,
      total: 3,
      paidRate: 67,
    });
  });

  it('builds top products by revenue and keeps measure-unit breakdown', () => {
    expect(buildTopProducts(orders, 2)).toEqual([
      {
        key: 'product:10',
        name: 'Thuoc A',
        revenue: 170000,
        totalLines: 2,
        unitBreakdown: [
          { unitName: 'Hộp', quantity: 1 },
          { unitName: 'Viên', quantity: 4 },
        ],
      },
      {
        key: 'product:20',
        name: 'Thuoc B',
        revenue: 30000,
        totalLines: 1,
        unitBreakdown: [
          { unitName: 'Viên', quantity: 1 },
        ],
      },
    ]);
  });

  it('builds a 7-day revenue series and fills empty days', () => {
    const series = buildRevenueSeries(orders, '7d', new Date('2026-06-08T12:00:00.000Z'));

    expect(series.points).toEqual([
      { key: '2026-5-2', label: '02/06', revenue: 0, orders: 0 },
      { key: '2026-5-3', label: '03/06', revenue: 0, orders: 0 },
      { key: '2026-5-4', label: '04/06', revenue: 0, orders: 0 },
      { key: '2026-5-5', label: '05/06', revenue: 0, orders: 0 },
      { key: '2026-5-6', label: '06/06', revenue: 0, orders: 0 },
      { key: '2026-5-7', label: '07/06', revenue: 120000, orders: 1 },
      { key: '2026-5-8', label: '08/06', revenue: 50000, orders: 1 },
    ]);
    expect(series.totalRevenue).toBe(170000);
    expect(series.totalOrders).toBe(2);
    expect(series.bestPoint).toEqual({ key: '2026-5-7', label: '07/06', revenue: 120000, orders: 1 });
  });

  it('builds a monthly revenue series', () => {
    const series = buildRevenueSeries(orders, 'monthly', new Date('2026-06-08T12:00:00.000Z'));
    const june = series.points[11];

    expect(series.points).toHaveLength(12);
    expect(june).toEqual({ key: '2026-5', label: '06/2026', revenue: 170000, orders: 2 });
  });
});
