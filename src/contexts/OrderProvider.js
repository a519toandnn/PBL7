import React, { createContext, useState } from 'react';

export const OrderContext = createContext();

const OrderProvider = ({children}) => {
    const [orders, setOrders] = useState([]);

    // Utility: parse product price strings like "32.000 VNĐ" -> 32000
    const parsePrice = (p) => {
        if (typeof p === 'number') return p;
        try {
            const cleaned = String(p).replace(/[^0-9.-]+/g, '');
            return parseFloat(cleaned) || 0;
        } catch (e) {
            return 0;
        }
    };

    //handle cart with quantity
    const handleCart = (product, quantity = 1) => {
        // Check if product already in cart
        const existingOrder = orders.find(item => item.id === product.id);
        
        if (existingOrder) {
            // Update quantity if already exists
            setOrders(orders.map(item => 
                item.id === product.id 
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            ));
        } else {
            // Add new product with numeric price and quantity
            const numericPrice = parsePrice(product.price);
            const orderItem = { ...product, price: numericPrice, quantity };
            setOrders([...orders, orderItem]);
        }
    };

    //remove product
    const removeProduct = (id) => {
        setOrders((prev) => {
            return prev.filter(item => {
                return item.id !== id
            })
        })
    }

    //update quantity
    const updateQuantity = (id, newQuantity) => {
        if (newQuantity <= 0) {
            removeProduct(id);
            return;
        }
        setOrders(orders.map(item =>
            item.id === id ? { ...item, quantity: newQuantity } : item
        ));
    }

    const value = {
        orders, 
        handleCart,
        removeProduct,
        updateQuantity,
        clearOrders: () => setOrders([]),
    }
    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    )
}

export default OrderProvider
