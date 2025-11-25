import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PRODUCTS } from '@/lib/products';

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState([]);
  
  // Mock Orders Data
  useEffect(() => {
    const savedOrders = localStorage.getItem('dabs_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      // Initialize with some mock orders for the admin panel
      setOrders([
        { id: 'ORD-001', customer: 'Alice Smith', date: '2023-10-15', total: 120, status: 'Completed', items: 3 },
        { id: 'ORD-002', customer: 'Bob Jones', date: '2023-10-18', total: 45, status: 'Processing', items: 1 },
        { id: 'ORD-003', customer: 'Charlie Day', date: '2023-10-20', total: 250, status: 'Pending', items: 2 },
      ]);
    }
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem('dabs_orders', JSON.stringify(orders));
    }
  }, [orders]);

  const updateInventory = (productId, newQuantity) => {
    setProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, inventory: newQuantity } : p)
    );
    // n8n-ready: trigger low stock alert webhook if newQuantity < 3
    if (newQuantity < 3) {
      console.log(`[n8n Trigger] Low stock alert for product ${productId}`);
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    setOrders(prev => 
      prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    );
    // n8n-ready: trigger order status update email webhook
    console.log(`[n8n Trigger] Order ${orderId} status updated to ${newStatus}`);
  };

  const addOrder = (newOrder) => {
    const order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      ...newOrder
    };
    setOrders(prev => [order, ...prev]);
    // n8n-ready: trigger new order email webhook
    console.log(`[n8n Trigger] New order received: ${order.id}`);
  };

  const getProduct = (id) => products.find(p => p.id === id);

  return (
    <StoreContext.Provider value={{ 
      products, 
      orders, 
      updateInventory, 
      updateOrderStatus, 
      addOrder,
      getProduct 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);