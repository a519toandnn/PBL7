import { adminNavItems, getAdminActivePath } from './AdminLayout';

describe('AdminLayout navigation', () => {
  it('keeps the product tab active for the admin root path', () => {
    expect(getAdminActivePath('/admin')).toBe('/admin');
  });

  it('keeps each admin child route mapped to its matching tab', () => {
    expect(getAdminActivePath('/admin/orders')).toBe('/admin/orders');
    expect(getAdminActivePath('/admin/customers')).toBe('/admin/customers');
    expect(getAdminActivePath('/admin/messages')).toBe('/admin/messages');
  });

  it('has one stable tab for each admin section', () => {
    expect(adminNavItems.map((item) => item.path)).toEqual([
      '/admin',
      '/admin/stats',
      '/admin/orders',
      '/admin/customers',
      '/admin/consultations',
      '/admin/messages',
    ]);
  });
});
