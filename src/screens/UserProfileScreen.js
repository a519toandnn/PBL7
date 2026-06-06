import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Bounce from 'react-reveal/Bounce';
import swal from 'sweetalert';
import useAuth from '../hooks/useAuth';
import { fetchUserAddresses } from '../utils/addressApi';
import { apiFetch, getAuthHeaders } from '../utils/apiClient';

const emptyAddressForm = {
    receiver_name: '',
    receiver_phone: '',
    address_line: '',
    ward: '',
    province: '',
    is_default: false,
};

const UserProfileScreen = () => {
    const { user, logOut, updateUser } = useAuth();
    const history = useHistory();
    const [editMode, setEditMode] = useState(false);
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressForm, setAddressForm] = useState(emptyAddressForm);
    const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
    const token = localStorage.getItem('token');
    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        photoURL: user?.photoURL || 'https://i.pravatar.cc/150?img=1'
    });

    useEffect(() => {
        if (!user?.id) return;
        fetch(`${apiBase}/order`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(json => {
                const payload = json.data || json;
                setOrders(Array.isArray(payload) ? payload : []);
            })
            .catch(() => setOrders([]));
    }, [apiBase, token, user?.id]);

    const loadAddresses = async () => {
        if (!user?.id) return;

        setAddressesLoading(true);
        try {
            const payload = await fetchUserAddresses();
            setAddresses(payload);
        } catch (error) {
            setAddresses([]);
        } finally {
            setAddressesLoading(false);
        }
    };

    useEffect(() => {
        loadAddresses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    // Handle form change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddressChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAddressForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const resetAddressForm = () => {
        setAddressForm(emptyAddressForm);
        setEditingAddressId(null);
        setShowAddressForm(false);
    };

    const handleEditAddress = (address) => {
        setAddressForm({
            receiver_name: address.receiver_name || '',
            receiver_phone: address.receiver_phone || '',
            address_line: address.address_line || '',
            ward: address.ward || '',
            province: address.province || '',
            is_default: Boolean(address.is_default),
        });
        setEditingAddressId(address.id);
        setShowAddressForm(true);
    };

    const handleSaveAddress = async (e) => {
        e.preventDefault();

        if (!addressForm.receiver_name || !addressForm.receiver_phone || !addressForm.address_line) {
            swal('Error', 'Please fill receiver name, phone and address line', 'error');
            return;
        }

        try {
            await apiFetch(
                editingAddressId ? `/user/addresses/${editingAddressId}` : '/user/addresses',
                {
                    method: editingAddressId ? 'PATCH' : 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        receiver_name: addressForm.receiver_name,
                        receiver_phone: addressForm.receiver_phone,
                        address_line: addressForm.address_line,
                        ward: addressForm.ward || undefined,
                        province: addressForm.province || undefined,
                        is_default: Boolean(addressForm.is_default),
                    }),
                }
            );

            await loadAddresses();
            resetAddressForm();
            swal('Success', editingAddressId ? 'Address updated' : 'Address added', 'success');
        } catch (error) {
            swal('Error', error.message || 'Address save failed', 'error');
        }
    };

    const handleDeleteAddress = async (addressId) => {
        const willDelete = await swal({
            title: 'Delete address?',
            text: 'This address will be removed from your account.',
            icon: 'warning',
            buttons: true,
            dangerMode: true,
        });

        if (!willDelete) return;

        try {
            await apiFetch(`/user/addresses/${addressId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(null),
            });
            await loadAddresses();
            swal('Success', 'Address deleted', 'success');
        } catch (error) {
            swal('Error', error.message || 'Address delete failed', 'error');
        }
    };

    const handleSaveProfile = async () => {
        try {
            const updated = await apiFetch('/user/profile', {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    full_name: formData.displayName,
                    phone: formData.phone,
                }),
            });

            const nextUser = updateUser({
                displayName: updated.full_name || formData.displayName,
                email: updated.email || formData.email,
                phone: updated.phone || formData.phone,
                photoURL: formData.photoURL,
            });

            setFormData((prev) => ({
                ...prev,
                displayName: nextUser.displayName || '',
                email: nextUser.email || '',
                phone: nextUser.phone || '',
                photoURL: nextUser.photoURL || prev.photoURL,
            }));
            swal("Success!", "Profile updated successfully!", "success");
            setEditMode(false);
        } catch (error) {
            swal("Error!", error.message || "Profile update failed", "error");
        }
    };

    // Handle logout
    const handleLogout = () => {
        swal({
            title: "Logout?",
            text: "Are you sure you want to logout?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willLogout) => {
            if (willLogout) {
                logOut();
            }
        });
    };

    return (
        <main className="max-w-screen-xl py-24 mx-auto px-6">
            <Bounce top>
                <div className="flex flex-col items-center space-x-2 pb-8">
                    <h1 className="text-4xl font-bold text-gray-800">My Profile</h1>
                    <div className="bg-blue-600 flex items-center justify-center w-16 h-1 mt-2 rounded-full"></div>
                </div>
            </Bounce>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Profile Card - Left */}
                <Bounce left>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-8">
                        <div className="flex flex-col items-center pb-6 border-b-2 border-blue-200">
                            <img 
                                src={formData.photoURL || 'https://i.pravatar.cc/150?img=1'} 
                                alt="Avatar"
                                className="w-32 h-32 rounded-full border-4 border-blue-600 mb-4 shadow-md"
                                onError={(e) => e.target.src = 'https://i.pravatar.cc/150?img=1'}
                            />
                            <h2 className="text-3xl font-bold text-gray-800">{formData.displayName || 'User'}</h2>
                            <p className="text-blue-600 font-semibold mt-2">{formData.email}</p>
                        </div>

                        {/* Profile Info (View Mode) */}
                        {!editMode && (
                            <div className="space-y-5 mt-6">
                                <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition">
                                    <label className="text-blue-600 font-bold text-sm uppercase tracking-wide">Full Name</label>
                                    <p className="text-gray-800 text-lg font-semibold mt-1">{formData.displayName || 'Not set'}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition">
                                    <label className="text-blue-600 font-bold text-sm uppercase tracking-wide">Email Address</label>
                                    <p className="text-gray-800 text-lg font-semibold mt-1 break-words">{formData.email}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition">
                                    <label className="text-blue-600 font-bold text-sm uppercase tracking-wide">Phone</label>
                                    <p className="text-gray-800 text-lg font-semibold mt-1">{formData.phone || 'Not set'}</p>
                                </div>
                                <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition">
                                    <label className="text-blue-600 font-bold text-sm uppercase tracking-wide">Member Since</label>
                                    <p className="text-gray-800 text-lg font-semibold mt-1">April 7, 2026</p>
                                </div>
                            </div>
                        )}

                        {/* Edit Form */}
                        {editMode && (
                            <div className="space-y-4 mt-6">
                                <div>
                                    <label className="block text-blue-600 font-bold text-sm uppercase tracking-wide mb-2">Full Name</label>
                                    <input 
                                        type="text"
                                        name="displayName"
                                        value={formData.displayName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-blue-600 font-bold text-sm uppercase tracking-wide mb-2">Email (Cannot Change)</label>
                                    <input 
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-blue-600 font-bold text-sm uppercase tracking-wide mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition"
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <div>
                                    <label className="block text-blue-600 font-bold text-sm uppercase tracking-wide mb-2">Avatar URL</label>
                                    <input 
                                        type="text"
                                        name="photoURL"
                                        value={formData.photoURL}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition"
                                        placeholder="Enter image URL"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Bounce>

                {/* Action Cards - Right */}
                <Bounce right>
                    <div className="flex flex-col space-y-6">
                        {/* Edit/Save Section */}
                        {!editMode ? (
                            <button 
                                onClick={() => setEditMode(true)}
                                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-blue-800 transition transform hover:scale-105 shadow-lg"
                            >
                                ✏️ Edit Profile
                            </button>
                        ) : (
                            <div className="flex flex-col space-y-3">
                                <button 
                                    onClick={handleSaveProfile}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-lg hover:from-green-600 hover:to-green-700 transition shadow-lg"
                                >
                                    ✓ Save Changes
                                </button>
                                <button 
                                    onClick={() => setEditMode(false)}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold text-lg rounded-lg hover:from-gray-500 hover:to-gray-600 transition shadow-lg"
                                >
                                    ✕ Cancel
                                </button>
                            </div>
                        )}

                        {/* Account Info Card */}
                        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-600">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="text-blue-600 mr-2">📊</span> Account Info
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <span className="text-gray-700 font-semibold">Status:</span>
                                    <span className="font-bold text-green-600 text-lg">● Active</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <span className="text-gray-700 font-semibold">Account Type:</span>
                                    <span className="font-bold text-blue-600">Regular User</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                    <span className="text-gray-700 font-semibold">Last Login:</span>
                                    <span className="font-bold text-blue-600">Today</span>
                                </div>
                            </div>
                        </div>

                        {/* Orders Card */}
                        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-600">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="text-blue-600 mr-2">🧾</span> Đơn hàng của bạn
                            </h3>

                            {orders.length === 0 ? (
                                <p className="text-gray-600">Chưa có đơn hàng nào.</p>
                            ) : (
                                <div className="space-y-3">
                                    {orders.slice(0, 5).map((o) => (
                                        <div key={o.id} className="p-3 bg-blue-50 rounded-lg flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-800 truncate">{o.order_no}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(o.created_at).toLocaleString()} • {o.status}
                                                </p>
                                            </div>
                                            <div className="font-bold text-blue-700 whitespace-nowrap">
                                                {Number(o.total_amount || 0).toLocaleString()} đ
                                            </div>
                                        </div>
                                    ))}
                                    {orders.length > 5 && (
                                        <p className="text-sm text-gray-500">+ {orders.length - 5} đơn hàng khác</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Shipping Address Card */}
                        <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-600">
                            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="text-blue-600 mr-2">📍</span> Shipping Address
                            </h3>
                            <AddressManager
                                addresses={addresses}
                                addressesLoading={addressesLoading}
                                showAddressForm={showAddressForm}
                                editingAddressId={editingAddressId}
                                addressForm={addressForm}
                                onToggleForm={() => {
                                    if (showAddressForm) {
                                        resetAddressForm();
                                        return;
                                    }
                                    setAddressForm(emptyAddressForm);
                                    setEditingAddressId(null);
                                    setShowAddressForm(true);
                                }}
                                onChange={handleAddressChange}
                                onSubmit={handleSaveAddress}
                                onEdit={handleEditAddress}
                                onDelete={handleDeleteAddress}
                            />
                        </div>

                        {/* Logout Button */}
                        <button 
                            onClick={handleLogout}
                            className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg rounded-lg hover:from-red-600 hover:to-red-700 transition shadow-lg"
                        >
                            🚪 Logout
                        </button>

                        {/* Back Button */}
                        <button 
                            onClick={() => history.goBack()}
                            className="w-full px-6 py-4 border-2 border-gray-400 text-gray-700 font-bold text-lg rounded-lg hover:bg-gray-100 transition"
                        >
                            ← Go Back
                        </button>
                    </div>
                </Bounce>
            </div>
        </main>
    );
};

const AddressManager = ({
    addresses,
    addressesLoading,
    showAddressForm,
    editingAddressId,
    addressForm,
    onToggleForm,
    onChange,
    onSubmit,
    onEdit,
    onDelete,
}) => {
    return (
        <>
            <div className="flex justify-end mb-4">
                <button
                    type="button"
                    onClick={onToggleForm}
                    className="px-3 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition text-sm"
                >
                    {showAddressForm ? 'Cancel' : '+ Add'}
                </button>
            </div>

            {addressesLoading ? (
                <p className="text-gray-600">Loading addresses...</p>
            ) : addresses.length === 0 && !showAddressForm ? (
                <p className="text-gray-600 mb-4">No address added yet</p>
            ) : (
                <div className="space-y-3">
                    {addresses.map((address) => (
                        <div key={address.id} className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-bold text-gray-900">{address.receiver_name}</p>
                                        {address.is_default && (
                                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1">{address.receiver_phone}</p>
                                    <p className="text-sm text-gray-700 mt-1">
                                        {[address.address_line, address.ward, address.province]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => onEdit(address)}
                                        className="text-sm font-semibold text-blue-700 hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(address.id)}
                                        className="text-sm font-semibold text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAddressForm && (
                <form onSubmit={onSubmit} className="mt-4 space-y-3 border-t border-blue-100 pt-4">
                    <input
                        type="text"
                        name="receiver_name"
                        value={addressForm.receiver_name}
                        onChange={onChange}
                        placeholder="Receiver name *"
                        className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-600"
                        required
                    />
                    <input
                        type="tel"
                        name="receiver_phone"
                        value={addressForm.receiver_phone}
                        onChange={onChange}
                        placeholder="Receiver phone *"
                        className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-600"
                        required
                    />
                    <textarea
                        name="address_line"
                        value={addressForm.address_line}
                        onChange={onChange}
                        placeholder="Address line *"
                        rows="2"
                        className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-600"
                        required
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            type="text"
                            name="ward"
                            value={addressForm.ward}
                            onChange={onChange}
                            placeholder="Ward"
                            className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-600"
                        />
                        <input
                            type="text"
                            name="province"
                            value={addressForm.province}
                            onChange={onChange}
                            placeholder="Province"
                            className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:border-blue-600"
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <input
                            type="checkbox"
                            name="is_default"
                            checked={addressForm.is_default}
                            onChange={onChange}
                            className="w-4 h-4"
                        />
                        Set as default address
                    </label>
                    <button
                        type="submit"
                        className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-md"
                    >
                        {editingAddressId ? 'Update Address' : 'Save Address'}
                    </button>
                </form>
            )}
        </>
    );
};

export default UserProfileScreen;
