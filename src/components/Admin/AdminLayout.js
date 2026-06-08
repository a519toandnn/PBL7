import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export const adminNavItems = [
  { path: '/admin', label: 'Sản phẩm', icon: '💊', exact: true },
  { path: '/admin/stats', label: 'Thống kê', icon: '📈' },
  { path: '/admin/orders', label: 'Đơn hàng', icon: '📦' },
  { path: '/admin/customers', label: 'Khách hàng', icon: '👤' },
  { path: '/admin/consultations', label: 'Tư vấn', icon: '💬' },
  { path: '/admin/messages', label: 'Tin nhắn', icon: '✉️' },
];

export const getAdminActivePath = (pathname) => {
  const matched = adminNavItems
    .filter((item) => item.exact ? pathname === item.path : pathname.startsWith(item.path))
    .sort((left, right) => right.path.length - left.path.length)[0];

  return matched?.path || '/admin';
};

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const activePath = getAdminActivePath(location.pathname);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Quản trị hệ thống</p>
          <h1 className="mt-1 text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>

        <nav className="mb-8 overflow-x-auto border-b border-gray-200">
          <div className="flex min-w-max gap-2">
            {adminNavItems.map((item) => {
              const isActive = activePath === item.path;

              return (
                <NavLink
                  key={item.path}
                  exact={item.exact}
                  to={item.path}
                  className={`mb-[-1px] inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <section>{children}</section>
      </div>
    </main>
  );
};

export default AdminLayout;
