import React, { useEffect, useMemo, useState } from 'react';
import swal from 'sweetalert';
import useAuth from '../hooks/useAuth';

const AdminCustomersScreen = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [customers, setCustomers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!isAdmin) return;
    loadCustomers();
  }, [isAdmin]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const payload = json.data.data || json;
      setCustomers(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Error loading customers:', err);
      setCustomers([]);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => {
      return (
        (c.full_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        String(c.id || '').includes(q)
      );
    });
  }, [customers, query]);

  const updateCustomer = async (customerId, patch) => {
    try {
      const res = await fetch(`${apiBase}/user/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) {
        swal('Error', json.message || 'Update failed', 'error');
        return;
      }
      const updated = json.data || json;
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      swal('Success', 'Customer updated', 'success');
    } catch (err) {
      swal('Error', 'Network error while updating customer', 'error');
    }
  };

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
          <h1 className="text-4xl font-bold text-gray-900">Customer Management</h1>
          <button
            onClick={loadCustomers}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
          >
            {loading ? 'Đang tải...' : 'Refresh'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, email, id..."
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">ID</th>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-900">{c.id}</td>
                    <td className="px-6 py-4 text-gray-700">{c.full_name}</td>
                    <td className="px-6 py-4 text-gray-600">{c.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={c.role}
                        onChange={(e) => updateCustomer(c.id, { role: e.target.value })}
                        className="px-3 py-2 rounded-lg bg-gray-50 border"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={c.status}
                        onChange={(e) => updateCustomer(c.id, { status: e.target.value })}
                        className="px-3 py-2 rounded-lg bg-gray-50 border"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="LOCKED">LOCKED</option>
                        <option value="DELETED">DELETED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No customers found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomersScreen;

