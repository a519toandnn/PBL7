import React, { useState, useEffect } from 'react';
import { BsPlus } from 'react-icons/bs';
import { useHistory } from 'react-router-dom';
import swal from 'sweetalert';
import useAuth from '../hooks/useAuth';
import AdminProductTable from '../components/Admin/AdminProductTable';
import AdminProductForm from '../components/Admin/AdminProductForm';
import { RiMessage2Line } from 'react-icons/ri';
import { fetchMedicinesAsProducts } from '../utils/productsApi';
import { apiFetch, getAuthHeaders } from '../utils/apiClient';

const DEFAULT_MEASURE_UNIT_ID = 1;

const emptyFormData = {
  title: '',
  slug: '',
  product_type: 'DRUG',
  category: '',
  category_ids: '',
  description: '',
  image_url: '',
  price: '',
  measure_unit_id: DEFAULT_MEASURE_UNIT_ID,
  manufacturer: '',
  usage: '',
  rating: 4,
  reviews: 0
};

const slugify = (value) => {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const parseNumberList = (value) => {
  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isFinite);
  }

  return String(value || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter(Number.isFinite);
};

const parsePrice = (value) => {
  const normalized = String(value || '').replace(/[^\d.-]/g, '');
  const price = Number(normalized);
  return Number.isFinite(price) ? price : 0;
};

const getDefaultPrice = (prices = []) => {
  return prices.find((price) => price.is_sell_default) || prices[0] || null;
};

const detailToFormData = (detail, fallback = {}) => {
  const defaultPrice = getDefaultPrice(detail.prices);

  return {
    ...emptyFormData,
    title: detail.name || fallback.title || '',
    slug: detail.slug || fallback.slug || '',
    product_type: detail.product_type || fallback.product_type || 'DRUG',
    category: detail.categories?.[0]?.name || fallback.category || '',
    category_ids: Array.isArray(detail.categories)
      ? detail.categories.map((category) => category.id).join(', ')
      : '',
    description: detail.description || fallback.description || '',
    image_url: detail.image_url || '',
    price: defaultPrice?.price ?? fallback.price ?? '',
    measure_unit_id: defaultPrice?.measure_id || DEFAULT_MEASURE_UNIT_ID,
    manufacturer: fallback.manufacturer || '',
    usage: detail.medical_info?.usage || fallback.usage || '',
    rating: fallback.rating || 4,
    reviews: fallback.reviews || 0,
  };
};

const toMedicinePayload = (formData) => {
  const price = parsePrice(formData.price);
  const measureUnitId = Number(formData.measure_unit_id || DEFAULT_MEASURE_UNIT_ID);

  return {
    name: formData.title.trim(),
    slug: (formData.slug || slugify(formData.title)).trim(),
    product_type: formData.product_type || 'DRUG',
    description: formData.description || null,
    image_url: formData.image_url || null,
    is_active: true,
    category_ids: parseNumberList(formData.category_ids),
    prices: price > 0
      ? [{
          measure_unit_id: measureUnitId,
          price,
          is_sell_default: true,
        }]
      : [],
    medical_info: {
      usage: formData.usage || '',
    },
  };
};

const AdminScreen = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyFormData);

  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN' || false;
  const history = useHistory();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await fetchMedicinesAsProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      swal('Error', 'Failed to load products', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'rating' || name === 'reviews' ? Number(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.price || !formData.measure_unit_id) {
      swal('Validation Error', 'Please fill in product name, price and measure unit ID', 'warning');
      return;
    }

    try {
      const payload = toMedicinePayload(formData);
      await apiFetch(editingId ? `/medicines/${editingId}` : '/medicines', {
        method: editingId ? 'PATCH' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      await fetchProducts();
      swal('Success', editingId ? 'Product updated successfully' : 'Product added successfully', 'success');
      setEditingId(null);
      setFormData(emptyFormData);
      setShowForm(false);
    } catch (error) {
      swal('Error', error.message || 'Save product failed', 'error');
    }
  };

  const handleEdit = async (product) => {
    setFormData({ ...emptyFormData, ...product });
    setEditingId(product.id);
    setShowForm(true);

    if (!product.slug) return;

    try {
      const detail = await apiFetch(`/medicines/${product.slug}`);
      setFormData(detailToFormData(detail, product));
    } catch (error) {
      swal('Warning', error.message || 'Failed to load product details', 'warning');
    }
  };

  const handleDelete = (id) => {
    swal({
      title: 'Are you sure?',
      text: 'This product will be deleted permanently',
      icon: 'warning',
      buttons: true,
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        apiFetch(`/medicines/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(null),
        })
          .then(() => {
            setProducts(products.filter(p => p.id !== id));
            swal('Success', 'Product deleted successfully', 'success');
          })
          .catch((error) => {
            swal('Error', error.message || 'Delete product failed', 'error');
          });
      }
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyFormData);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
          <div className="flex justify-between items-center gap-4 mb-6">
            <input 
              type="text"
              placeholder="Tìm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-3">
            <button
              onClick={() => history.push('/admin/stats')}
              className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition"
            >
              📈 Statistics
            </button>
            <button
              onClick={() => history.push('/admin/orders')}
              className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              📦 Order Management
            </button>
            <button
              onClick={() => history.push('/admin/customers')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
            >
              👤 Customers
            </button>
            <button
              onClick={() => history.push('/admin/consultations')}
              className="flex items-center gap-2 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition"
            >
              <RiMessage2Line /> Consultations
            </button>
            <button
              onClick={() => history.push('/admin/messages')}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              💬 Messages
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <BsPlus /> Add Product
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <AdminProductForm
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            editing={!!editingId}
          />
        )}

        {/* Products Table */}
        <AdminProductTable products={filteredProducts} onEdit={handleEdit} onDelete={handleDelete} />

        {filteredProducts.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{searchTerm ? 'No products match your search.' : 'No products found. Click "Add Product" to get started.'}</p>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">Total Products</p>
            <p className="text-3xl font-bold text-blue-600">{products.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">Average Rating</p>
            <p className="text-3xl font-bold text-green-600">
              {(products.length > 0 ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1) : 0)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6">
            <p className="text-gray-600 text-sm">Total Reviews</p>
            <p className="text-3xl font-bold text-purple-600">
              {products.reduce((sum, p) => sum + (p.reviews || 0), 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScreen;
