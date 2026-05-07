import React, { useState, useEffect } from 'react';
import { BsPlus } from 'react-icons/bs';
import { useHistory } from 'react-router-dom';
import swal from 'sweetalert';
import useAuth from '../hooks/useAuth';
import AdminProductTable from '../components/Admin/AdminProductTable';
import AdminProductForm from '../components/Admin/AdminProductForm';
import { RiMessage2Line } from 'react-icons/ri';
import { fetchMedicinesAsProducts } from '../utils/productsApi';

const AdminScreen = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    manufacturer: '',
    usage: '',
    rating: 4,
    reviews: 0
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title || !formData.category || !formData.price) {
      swal('Validation Error', 'Please fill in all required fields', 'warning');
      return;
    }

    if (editingId) {
      // Update existing product
      const updatedProducts = products.map(p =>
        p.id === editingId
          ? { ...p, ...formData }
          : p
      );
      setProducts(updatedProducts);
      swal('Success', 'Product updated successfully', 'success');
      setEditingId(null);
    } else {
      // Add new product
      const newProduct = {
        id: Math.max(...products.map(p => p.id), 0) + 1,
        ...formData,
        image: '../assets/products/product' + ((products.length % 8) + 1) + '.jpg'
      };
      setProducts([...products, newProduct]);
      swal('Success', 'Product added successfully', 'success');
    }

    setFormData({
      title: '',
      category: '',
      description: '',
      price: '',
      manufacturer: '',
      usage: '',
      rating: 4,
      reviews: 0
    });
    setShowForm(false);
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product.id);
    setShowForm(true);
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
        setProducts(products.filter(p => p.id !== id));
        swal('Success', 'Product deleted successfully', 'success');
      }
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      category: '',
      description: '',
      price: '',
      manufacturer: '',
      usage: '',
      rating: 4,
      reviews: 0
    });
  };

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
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
        <AdminProductTable products={products} onEdit={handleEdit} onDelete={handleDelete} />

        {products.length === 0 && !showForm && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No products found. Click "Add Product" to get started.</p>
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
