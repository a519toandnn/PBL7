import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import swal from 'sweetalert';
import useOrder from '../hooks/useOrder';
import useAuth from '../hooks/useAuth';
import Bounce from 'react-reveal/Bounce';

const CheckoutScreen = () => {
    const { orders, clearOrders } = useOrder();
    const { user } = useAuth();
    const history = useHistory();
    const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:3001';
    const token = localStorage.getItem('token');
    const [paymentForm, setPaymentForm] = useState({
        cardName: '',
        cardNumber: '',
        expiryDate: '',
        cvv: ''
    });

    // Helper to parse numeric price (handles legacy string prices)
    const parsePriceVal = (p) => {
        if (typeof p === 'number') return p;
        const cleaned = String(p).replace(/[^0-9.-]+/g, '');
        return parseFloat(cleaned) || 0;
    };

    // Calculate total using numeric prices
    const totalAmountNum = orders.reduce((sum, item) => {
        const price = parsePriceVal(item.price);
        const qty = item.quantity || 1;
        return sum + (price * qty);
    }, 0);
    const totalAmount = totalAmountNum.toFixed(2);

    // Handle form input change
    const handleChange = (e) => {
        const { name, value } = e.target;
        setPaymentForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle payment
    const handlePayment = async (e) => {
        e.preventDefault();

        // Validation
        if (!paymentForm.cardName || !paymentForm.cardNumber || !paymentForm.expiryDate || !paymentForm.cvv) {
            swal("Error!", "Please fill in all payment fields", "error");
            return;
        }

        if (!user?.id) {
            swal("Login Required", "Please sign in to place an order", "info");
            history.push('/signin');
            return;
        }

        try {
            swal("Processing...", "Please wait", "info");

            // Build items with measure_unit_id by loading medicine detail (default sell unit)
            const itemInputs = await Promise.all(
                orders.map(async (item) => {
                    const slug = item.slug;
                    if (!slug) throw new Error('missing_slug');
                    const res = await fetch(`${apiBase}/medicines/${slug}`);
                    const json = await res.json();
                    const med = json.data || json;
                    const prices = Array.isArray(med?.prices) ? med.prices : [];
                    const defaultPrice = prices.find((p) => p.is_sell_default) || prices[0];
                    if (!defaultPrice?.measure_id) throw new Error('missing_measure_unit');
                    return {
                        product_id: item.id,
                        measure_unit_id: defaultPrice.measure_id,
                        quantity: item.quantity || 1,
                    };
                })
            );

            const createOrderRes = await fetch(`${apiBase}/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    user_id: user.id,
                    note: 'Web checkout',
                    items: itemInputs,
                }),
            });

            const createJson = await createOrderRes.json();
            if (!createOrderRes.ok) {
                swal("Error!", createJson.message || "Checkout failed", "error");
                return;
            }

            // Simulate payment done
            swal("Success!", "Payment completed! Your order has been placed.", "success");
            clearOrders();
            history.push('/orders');
        } catch (err) {
            const msg =
                err?.message === 'missing_slug'
                    ? 'Sản phẩm thiếu slug nên không tạo được đơn hàng.'
                    : 'Checkout failed. Please try again.';
            swal("Error!", msg, "error");
        }
    };

    // If no items in cart, redirect
    if (orders.length === 0) {
        return (
            <main className="h-screen flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold text-gray-700 mb-4">Your cart is empty</h1>
                <p className="text-gray-600 mb-6">Add products before proceeding to checkout</p>
                <button 
                    onClick={() => history.push('/products')}
                    className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Continue Shopping
                </button>
            </main>
        );
    }

    return (
        <main className="max-w-screen-xl py-24 mx-auto px-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-10">Checkout</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Order Summary */}
                <Bounce left>
                    <div className="bg-gray-50 rounded-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h2>
                        
                        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                            {orders.map(item => (
                                <div key={item.id} className="flex justify-between items-center border-b pb-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{item.title}</h3>
                                        <p className="text-sm text-gray-600">Qty: {item.quantity || 1} × ${parsePriceVal(item.price).toLocaleString()}</p>
                                    </div>
                                    <p className="font-bold text-blue-600">${((parsePriceVal(item.price) * (item.quantity || 1)).toFixed(2))}</p>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="border-t-2 pt-4 space-y-2">
                            <div className="flex justify-between text-gray-700">
                                <span>Subtotal:</span>
                                <span>${totalAmount}</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Shipping:</span>
                                <span>$0 (Free)</span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                                <span>Tax (10%):</span>
                                <span>${(totalAmountNum * 0.1).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-2xl font-bold text-blue-600 pt-4 border-t">
                                <span>Total:</span>
                                <span>${(totalAmountNum + (totalAmountNum * 0.1)).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </Bounce>

                {/* Payment Form */}
                <Bounce right>
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Payment Information</h2>
                        
                        <form onSubmit={handlePayment} className="space-y-4">
                            {/* Customer Info */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Email</label>
                                <input 
                                    type="email" 
                                    value={user.email || user.displayName || 'customer@example.com'}
                                    disabled
                                    className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600"
                                />
                            </div>

                            {/* Cardholder Name */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Cardholder Name</label>
                                <input 
                                    type="text" 
                                    name="cardName"
                                    value={paymentForm.cardName}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            {/* Card Number */}
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Card Number</label>
                                <input 
                                    type="text" 
                                    name="cardNumber"
                                    value={paymentForm.cardNumber}
                                    onChange={e => setPaymentForm({...paymentForm, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16)})}
                                    placeholder="1234 5678 9012 3456"
                                    maxLength="16"
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>

                            {/* Expiry & CVV */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">Expiry Date</label>
                                    <input 
                                        type="text" 
                                        name="expiryDate"
                                        value={paymentForm.expiryDate}
                                        onChange={e => setPaymentForm({...paymentForm, expiryDate: e.target.value})}
                                        placeholder="MM/YY"
                                        maxLength="5"
                                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-semibold mb-2">CVV</label>
                                    <input 
                                        type="text" 
                                        name="cvv"
                                        value={paymentForm.cvv}
                                        onChange={e => setPaymentForm({...paymentForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 3)})}
                                        placeholder="123"
                                        maxLength="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Note: This is a demo */}
                            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
                                <strong>Demo Mode:</strong> You can enter any values. This is not a real payment gateway.
                            </div>

                            {/* Buttons */}
                            <div className="flex space-x-4 pt-6">
                                <button 
                                    type="button"
                                    onClick={() => history.goBack()}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-semibold"
                                >
                                    Back
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
                                >
                                    Place Order
                                </button>
                            </div>
                        </form>
                    </div>
                </Bounce>
            </div>
        </main>
    );
};

export default CheckoutScreen;
