import React, { useEffect, useMemo, useState } from 'react';
import { FaArrowLeft, FaCheckCircle, FaCreditCard, FaMapMarkerAlt, FaMoneyBillWave, FaShoppingBag } from 'react-icons/fa';
import { useHistory } from 'react-router-dom';
import swal from 'sweetalert';
import useOrder from '../hooks/useOrder';
import useAuth from '../hooks/useAuth';
import { fetchUserAddresses } from '../utils/addressApi';
import { CONSULTATION_PRICE_TEXT, formatCurrency, needsPriceConsultation } from '../utils/productsApi';
import { apiFetch, getAuthHeaders } from '../utils/apiClient';

const CHECKOUT_ORDER_PREFIX = 'pending_checkout_order';
const ACTIVE_CHECKOUT_PREFIX = 'active_checkout_order';

const getCheckoutOrderStorageKey = (userId, cartItemIds) => {
    const stableIds = [...cartItemIds].sort((a, b) => Number(a) - Number(b)).join(',');
    return `${CHECKOUT_ORDER_PREFIX}:${userId}:${stableIds}`;
};

const getActiveCheckoutStorageKey = (userId) => `${ACTIVE_CHECKOUT_PREFIX}:${userId}`;

const loadStoredCheckout = (storageKey) => {
    try {
        const raw = localStorage.getItem(storageKey);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
};

const saveStoredCheckout = (storageKey, checkout) => {
    localStorage.setItem(
        storageKey,
        JSON.stringify({
            ...checkout,
            updatedAt: new Date().toISOString(),
        })
    );
};

const clearStoredCheckout = (storageKey) => {
    localStorage.removeItem(storageKey);
};

const parsePriceVal = (p) => {
    if (typeof p === 'number') return p;
    const cleaned = String(p).replace(/[^0-9.-]+/g, '');
    return parseFloat(cleaned) || 0;
};

const normalizePayment = (response) => ({
    orderId: response?.order_id ?? response?.id,
    payment: response?.payment || null,
    nextAction: response?.next_action || { type: 'NONE' },
    message: response?.message || '',
});

const formatAddressLine = (address) => {
    if (!address) return '';

    return [address.address_line, address.ward, address.province]
        .filter(Boolean)
        .join(', ');
};

const paymentMethods = [
    {
        code: 'COD',
        title: 'Thanh toán khi nhận hàng',
        description: 'Đặt hàng trước, thanh toán tiền mặt khi nhận thuốc.',
        icon: FaMoneyBillWave,
    },
    {
        code: 'VNPAY',
        title: 'Thanh toán bằng VNPAY',
        description: 'Demo hiện tại sẽ xác nhận thanh toán thành công ngay.',
        icon: FaCreditCard,
    },
];

const CheckoutScreen = () => {
    const { orders, selectedCheckoutIds, loadCart } = useOrder();
    const { user } = useAuth();
    const history = useHistory();
    const activeCheckout = user?.id ? loadStoredCheckout(getActiveCheckoutStorageKey(user.id)) : null;
    const [paymentMethod, setPaymentMethod] = useState(activeCheckout?.paymentMethod || 'VNPAY');
    const [note, setNote] = useState(activeCheckout?.note || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [addressesLoading, setAddressesLoading] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState(activeCheckout?.selectedAddress?.id || activeCheckout?.selectedAddressId || '');

    useEffect(() => {
        if (!user?.id) return;

        let mounted = true;

        const loadAddresses = async () => {
            setAddressesLoading(true);
            try {
                const payload = await fetchUserAddresses();
                if (mounted) {
                    setAddresses(payload);
                }
            } catch (error) {
                if (mounted) {
                    setAddresses([]);
                }
            } finally {
                if (mounted) {
                    setAddressesLoading(false);
                }
            }
        };

        loadAddresses();

        return () => {
            mounted = false;
        };
    }, [user?.id]);

    useEffect(() => {
        if (selectedAddressId || addresses.length === 0) return;

        const defaultAddress = addresses.find((address) => address.is_default) || addresses[0];
        setSelectedAddressId(defaultAddress.id);
    }, [addresses, selectedAddressId]);

    const liveSelectedOrders = useMemo(() => {
        return orders.filter((item) => selectedCheckoutIds.includes(item.cartKey));
    }, [orders, selectedCheckoutIds]);

    const isUsingStoredCheckout = liveSelectedOrders.length === 0 && Array.isArray(activeCheckout?.items);

    const selectedOrders = useMemo(() => {
        return isUsingStoredCheckout ? activeCheckout.items : liveSelectedOrders;
    }, [liveSelectedOrders, activeCheckout, isUsingStoredCheckout]);

    const cartItemIds = useMemo(() => {
        const ids = selectedOrders.map((item) => item.cartItemId).filter(Boolean);
        return ids.length > 0 ? ids : activeCheckout?.cartItemIds || [];
    }, [selectedOrders, activeCheckout]);

    const totalAmountNum = selectedOrders.reduce((sum, item) => {
        if (needsPriceConsultation(item.price)) return sum;
        return sum + (parsePriceVal(item.price) * (item.quantity || 1));
    }, 0);

    const selectedPayment = paymentMethods.find((method) => method.code === paymentMethod);
    const hasCheckoutItems = selectedOrders.length > 0 && cartItemIds.length > 0;
    const hasPendingOrder = Boolean(activeCheckout?.orderId) && isUsingStoredCheckout;
    const selectedAddress =
        addresses.find((address) => String(address.id) === String(selectedAddressId)) ||
        (hasPendingOrder ? activeCheckout?.selectedAddress : null) ||
        null;
    const canSubmit = hasCheckoutItems && (Boolean(selectedAddress) || hasPendingOrder) && !addressesLoading;

    const getPendingStorageKeys = () => ({
        checkoutKey: getCheckoutOrderStorageKey(user.id, cartItemIds),
        activeKey: getActiveCheckoutStorageKey(user.id),
    });

    const persistPendingCheckout = (checkoutKey, activeKey, checkout) => {
        saveStoredCheckout(checkoutKey, checkout);
        saveStoredCheckout(activeKey, checkout);
    };

    const clearPendingCheckout = (checkoutKey, activeKey) => {
        clearStoredCheckout(checkoutKey);
        clearStoredCheckout(activeKey);
    };

    const handlePayment = async (e) => {
        e.preventDefault();

        if (!user?.id) {
            swal('Login Required', 'Please sign in to place an order', 'info');
            history.push('/signin');
            return;
        }

        if (!hasCheckoutItems) {
            swal('Error!', 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.', 'error');
            return;
        }

        if (!selectedAddress && !hasPendingOrder) {
            swal('Thiếu địa chỉ giao hàng', 'Vui lòng tạo và chọn địa chỉ giao hàng trước khi checkout.', 'warning');
            return;
        }

        if (cartItemIds.some((id) => !id)) {
            swal('Error!', 'Giỏ hàng chưa đồng bộ với backend, vui lòng tải lại trang và thử lại.', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const authHeaders = getAuthHeaders();
            const { checkoutKey, activeKey } = getPendingStorageKeys();
            const pendingCheckout =
                loadStoredCheckout(checkoutKey) ||
                (isUsingStoredCheckout ? loadStoredCheckout(activeKey) : null);
            let orderId = pendingCheckout?.orderId;

            if (!orderId) {
                const order = await apiFetch('/order/checkout', {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({
                        cart_item_ids: cartItemIds,
                        address_id: Number(selectedAddress.id),
                        note: note.trim(),
                    }),
                });

                const createdOrderId = order?.order_id ?? order?.id;

                if (!createdOrderId) {
                    throw new Error('missing_order_id');
                }

                orderId = createdOrderId;
            }

            persistPendingCheckout(checkoutKey, activeKey, {
                orderId,
                cartItemIds,
                note,
                paymentMethod,
                selectedAddressId: selectedAddress?.id,
                selectedAddress,
                items: selectedOrders,
                totalAmount: totalAmountNum,
            });

            const paymentResponse = await apiFetch(`/payment/order/${orderId}/initiate`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ payment_method_code: paymentMethod }),
            });
            const { payment, nextAction, message } = normalizePayment(paymentResponse);

            if (nextAction?.type === 'REDIRECT' && nextAction?.payment_url) {
                window.location.href = nextAction.payment_url;
                return;
            }

            if (payment?.status === 'SUCCESS') {
                clearPendingCheckout(checkoutKey, activeKey);
                await loadCart();
                swal('Thanh toán thành công', 'Đơn hàng đã được xác nhận.', 'success');
                history.push('/orders');
                return;
            }

            if (paymentMethod === 'COD' && payment?.status === 'PENDING') {
                clearPendingCheckout(checkoutKey, activeKey);
                await loadCart();
                swal('Đặt hàng thành công', 'Phương thức thanh toán: Thanh toán khi nhận hàng.\nTrạng thái thanh toán: Chờ thu tiền.', 'success');
                history.push('/orders');
                return;
            }

            throw new Error(message || 'payment_not_completed');
        } catch (error) {
            swal('Thanh toán chưa hoàn tất', error?.message || 'Vui lòng thử lại. FE sẽ dùng lại đơn hàng vừa tạo để retry.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!hasCheckoutItems) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-gray-50">
                <FaShoppingBag className="text-5xl text-blue-600 mb-4" />
                <h1 className="text-3xl font-bold text-gray-800 mb-3">Không có sản phẩm để thanh toán</h1>
                <p className="text-gray-600 mb-6">Hãy chọn sản phẩm trong giỏ hàng trước khi checkout.</p>
                <button
                    onClick={() => history.push('/orders')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                >
                    Quay lại giỏ hàng
                </button>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 py-24 px-6">
            <section className="max-w-screen-xl mx-auto">
                <button
                    type="button"
                    onClick={() => history.goBack()}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 mb-6"
                >
                    <FaArrowLeft />
                    Quay lại
                </button>

                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Checkout</p>
                        <h1 className="text-4xl font-bold text-gray-900 mt-2">Thanh toán đơn hàng</h1>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-md px-4 py-3">
                        <FaCheckCircle className="text-blue-600" />
                        <span>Giỏ hàng</span>
                        <span className="text-gray-300">/</span>
                        <span>Tạo đơn</span>
                        <span className="text-gray-300">/</span>
                        <span className="font-semibold text-gray-900">Thanh toán</span>
                    </div>
                </div>

                <form onSubmit={handlePayment} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <section className="lg:col-span-7 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xl font-bold text-gray-900">Sản phẩm đã chọn</h2>
                                <span className="text-sm font-semibold text-gray-500">{selectedOrders.length} sản phẩm</span>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {selectedOrders.map((item) => (
                                    <div key={item.cartKey || item.cartItemId || item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="w-20 h-20 rounded-md border border-gray-100 object-contain bg-white"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 leading-snug">{item.title}</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Số lượng: {item.quantity || 1}
                                                {item.measureUnitName ? ` / ${item.measureUnitName}` : ''}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {needsPriceConsultation(item.price) ? (
                                                <p className="font-semibold text-blue-700">{CONSULTATION_PRICE_TEXT}</p>
                                            ) : (
                                                <>
                                                    <p className="font-bold text-gray-900">{formatCurrency(parsePriceVal(item.price) * (item.quantity || 1))}</p>
                                                    <p className="text-sm text-gray-500">{formatCurrency(parsePriceVal(item.price))}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Địa chỉ giao hàng</h2>
                                    <p className="text-sm text-gray-500 mt-1">Vui lòng chọn địa chỉ nhận hàng trước khi thanh toán.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => history.push('/profile')}
                                    className="px-4 py-2 rounded-md border border-blue-200 text-sm font-bold text-blue-600 hover:bg-blue-50"
                                >
                                    Thêm địa chỉ
                                </button>
                            </div>

                            {addressesLoading ? (
                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                    Đang tải địa chỉ...
                                </div>
                            ) : addresses.length === 0 ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                    <div className="flex gap-3">
                                        <FaMapMarkerAlt className="text-red-500 mt-1" />
                                        <div>
                                            <p className="font-bold text-red-700">Chưa có địa chỉ giao hàng</p>
                                            <p className="text-sm text-red-600 mt-1">
                                                Bạn cần tạo địa chỉ và chọn địa chỉ trước khi checkout.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {addresses.map((address) => {
                                        const isSelected = String(selectedAddressId) === String(address.id);

                                        return (
                                            <button
                                                key={address.id}
                                                type="button"
                                                onClick={() => setSelectedAddressId(address.id)}
                                                className={`w-full rounded-lg border p-4 text-left transition ${
                                                    isSelected
                                                        ? 'border-blue-600 bg-blue-50'
                                                        : 'border-gray-200 bg-white hover:border-blue-300'
                                                }`}
                                            >
                                                <span className="flex items-start gap-3">
                                                    <span className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center ${
                                                        isSelected ? 'border-blue-600' : 'border-gray-300'
                                                    }`}>
                                                        {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-gray-900">{address.receiver_name}</span>
                                                            {address.is_default && (
                                                                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                                                                    Mặc định
                                                                </span>
                                                            )}
                                                        </span>
                                                        <span className="block text-sm text-gray-600 mt-1">{address.receiver_phone}</span>
                                                        <span className="block text-sm text-gray-600 mt-1">{formatAddressLine(address)}</span>
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <label htmlFor="checkout-note" className="block text-xl font-bold text-gray-900 mb-3">
                                Ghi chú đơn hàng
                            </label>
                            <textarea
                                id="checkout-note"
                                value={note}
                                onChange={(event) => setNote(event.target.value)}
                                rows={4}
                                maxLength={500}
                                placeholder="Ví dụ: Giao trong giờ hành chính, gọi trước khi giao..."
                                className="w-full resize-none rounded-md border border-gray-300 px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="flex justify-between mt-2 text-sm text-gray-500">
                                <span>{note.length}/500</span>
                            </div>
                        </div>
                    </section>

                    <aside className="lg:col-span-5">
                        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-5">Phương thức thanh toán</h2>

                            <div className="space-y-3">
                                {paymentMethods.map((method) => {
                                    const Icon = method.icon;
                                    const isSelected = paymentMethod === method.code;

                                    return (
                                        <button
                                            key={method.code}
                                            type="button"
                                            onClick={() => setPaymentMethod(method.code)}
                                            className={`w-full text-left rounded-lg border p-4 transition ${
                                                isSelected
                                                    ? 'border-blue-600 bg-blue-50 shadow-sm'
                                                    : 'border-gray-200 bg-white hover:border-blue-300'
                                            }`}
                                        >
                                            <span className="flex items-start gap-3">
                                                <span className={`w-11 h-11 rounded-md flex items-center justify-center ${
                                                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    <Icon />
                                                </span>
                                                <span className="flex-1">
                                                    <span className="flex items-center justify-between gap-3">
                                                        <span className="font-bold text-gray-900">{method.title}</span>
                                                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                            isSelected ? 'border-blue-600' : 'border-gray-300'
                                                        }`}>
                                                            {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                                        </span>
                                                    </span>
                                                    <span className="block text-sm text-gray-500 mt-1">{method.description}</span>
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="border-t border-gray-100 mt-6 pt-5 space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tạm tính</span>
                                    <span>{formatCurrency(totalAmountNum)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Phí vận chuyển</span>
                                    <span>0đ</span>
                                </div>
                                <div className="flex justify-between text-2xl font-bold text-gray-900 pt-3 border-t border-gray-100">
                                    <span>Tổng cộng</span>
                                    <span className="text-blue-600">{formatCurrency(totalAmountNum)}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !canSubmit}
                                className="w-full mt-6 rounded-md bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isSubmitting
                                    ? 'Đang xử lý...'
                                    : !selectedAddress && !hasPendingOrder
                                        ? 'Chọn địa chỉ giao hàng'
                                        : selectedPayment?.code === 'COD'
                                            ? 'Đặt hàng'
                                            : 'Thanh toán qua VNPAY'}
                            </button>

                        </div>
                    </aside>
                </form>
            </section>
        </main>
    );
};

export default CheckoutScreen;
