import React, { createContext, useCallback, useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import { apiFetch, getAuthHeaders } from '../utils/apiClient';
import { searchMedicinePage } from '../utils/productsApi';

export const OrderContext = createContext();

const fallbackImage = '/assets/products/product1.jpg';
const cartProductCache = new Map();

const getCartKey = (productId, measureUnitId) => `${productId}:${measureUnitId || 'default'}`;

const getProductCacheKey = (productId) => String(productId || '');

const cacheCartProduct = (product) => {
    if (!product?.id) return null;

    const cachedProduct = {
        image: product.image || product.image_url || product.product_image_url || fallbackImage,
        slug: product.slug || product.product_slug || '',
    };

    cartProductCache.set(getProductCacheKey(product.id), cachedProduct);
    return cachedProduct;
};

const parsePrice = (p) => {
    if (typeof p === 'number') return p;
    try {
        const cleaned = String(p).replace(/[^0-9.-]+/g, '');
        return parseFloat(cleaned) || 0;
    } catch (e) {
        return 0;
    }
};

const getDefaultMeasureUnitId = async (product) => {
    if (product.measureId) return product.measureId;
    if (product.measure_unit_id) return product.measure_unit_id;

    if (!product.slug) {
        throw new Error('missing_measure_unit');
    }

    const detail = await apiFetch(`/medicines/${product.slug}`);
    const prices = Array.isArray(detail?.prices) ? detail.prices : [];
    const defaultPrice = prices.find((item) => item.is_sell_default) || prices[0];

    if (!defaultPrice?.measure_id) {
        throw new Error('missing_measure_unit');
    }

    return defaultPrice.measure_id;
};

const mapCartItemToOrder = (item, product = null) => {
    const productId = item.product_id;
    const measureId = item.measure_unit_id;

    return {
        id: productId,
        cartItemId: item.cart_item_id,
        cartKey: getCartKey(productId, measureId),
        title: item.product_name,
        image: item.image_url || item.product_image_url || product?.image || fallbackImage,
        price: parsePrice(item.unit_price),
        quantity: item.quantity || 1,
        measureId,
        measureUnitName: item.measure_unit_name || '',
        unitName: item.measure_unit_name || '',
        slug: item.product_slug || product?.slug || '',
        subtotal: parsePrice(item.subtotal),
    };
};

const resolveCartProduct = async (item) => {
    if (item.image_url || item.product_image_url) {
        return {
            image: item.image_url || item.product_image_url,
            slug: item.product_slug || '',
        };
    }

    const cachedProduct = cartProductCache.get(getProductCacheKey(item.product_id));
    if (cachedProduct) {
        return cachedProduct;
    }

    try {
        const result = await searchMedicinePage({
            q: item.product_name,
            page: 1,
            limit: 5,
        });
        const product = result.products.find((candidate) => candidate.id === item.product_id);
        return cacheCartProduct(product) || null;
    } catch (error) {
        return null;
    }
};

const OrderProvider = ({children}) => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [selectedCheckoutIds, setSelectedCheckoutIds] = useState([]);

    const loadCart = useCallback(async () => {
        if (!user?.id) {
            setOrders([]);
            setSelectedCheckoutIds([]);
            return [];
        }

        const cart = await apiFetch('/cart', {
            headers: getAuthHeaders(null),
        });
        const mapped = Array.isArray(cart?.items)
            ? await Promise.all(
                cart.items.map(async (item) => {
                    const product = await resolveCartProduct(item);
                    return mapCartItemToOrder(item, product);
                })
            )
            : [];
        const availableKeys = mapped.map((item) => item.cartKey);

        setOrders(mapped);
        setSelectedCheckoutIds((prev) => {
            const kept = prev.filter((id) => availableKeys.includes(id));
            return kept.length > 0 ? kept : availableKeys;
        });

        return mapped;
    }, [user?.id]);

    useEffect(() => {
        loadCart().catch(() => {
            setOrders([]);
            setSelectedCheckoutIds([]);
        });
    }, [loadCart]);

    const handleCart = async (product, quantity = 1) => {
        const measureUnitId = await getDefaultMeasureUnitId(product);
        cacheCartProduct(product);

        await apiFetch('/cart/add', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                product_id: product.id,
                measure_unit_id: measureUnitId,
                quantity,
            }),
        });

        const cartItems = await loadCart();
        const addedKey = getCartKey(product.id, measureUnitId);

        if (cartItems.some((item) => item.cartKey === addedKey)) {
            setSelectedCheckoutIds((prev) =>
                prev.includes(addedKey) ? prev : [...prev, addedKey]
            );
        }
    };

    const findOrderLine = (cartKey) => {
        return orders.find((item) => item.cartKey === cartKey || item.id === cartKey);
    };

    const removeProduct = async (cartKey) => {
        const item = findOrderLine(cartKey);
        if (!item?.measureId) return;

        await apiFetch(`/cart/item/${item.id}/unit/${item.measureId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(null),
        });
        setSelectedCheckoutIds((prev) => prev.filter((itemId) => itemId !== item.cartKey));
        await loadCart();
    };

    const updateQuantity = async (cartKey, newQuantity) => {
        const item = findOrderLine(cartKey);
        if (!item?.measureId) return;

        if (newQuantity <= 0) {
            await removeProduct(item.cartKey);
            return;
        }

        const nextQuantity = Number(newQuantity);
        if (!Number.isFinite(nextQuantity) || nextQuantity === item.quantity) return;

        if (nextQuantity > item.quantity) {
            await apiFetch('/cart/add', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    product_id: item.id,
                    measure_unit_id: item.measureId,
                    quantity: nextQuantity - item.quantity,
                }),
            });
        } else {
            await apiFetch(`/cart/item/${item.id}/unit/${item.measureId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(null),
            });

            await apiFetch('/cart/add', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    product_id: item.id,
                    measure_unit_id: item.measureId,
                    quantity: nextQuantity,
                }),
            });
        }

        await loadCart();
    };

    const clearOrders = async () => {
        if (user?.id) {
            await apiFetch('/cart/clear', {
                method: 'DELETE',
                headers: getAuthHeaders(null),
            });
        }

        setOrders([]);
        setSelectedCheckoutIds([]);
    };

    const clearSelectedOrders = async () => {
        const selectedItems = orders.filter((item) =>
            selectedCheckoutIds.includes(item.cartKey)
        );

        await Promise.all(
            selectedItems.map((item) =>
                apiFetch(`/cart/item/${item.id}/unit/${item.measureId}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(null),
                })
            )
        );

        await loadCart();
    };

    const value = {
        orders,
        handleCart,
        removeProduct,
        updateQuantity,
        selectedCheckoutIds,
        setSelectedCheckoutIds,
        loadCart,
        clearOrders,
        clearSelectedOrders,
    };

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
};

export default OrderProvider;
