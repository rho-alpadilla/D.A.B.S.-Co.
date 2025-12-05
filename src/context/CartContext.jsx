// src/context/CartContext.jsx ← FINAL: TRACKS SALES FOR TOP SELLERS
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dabs_cart');
    if (saved) setCartItems(JSON.parse(saved));
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('dabs_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...product, quantity }];
    });
    toast({ title: "Added!", description: `${product.name} added to cart.` });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setCartItems([]);

  // UPDATED: CHECKOUT + INCREMENT totalSold FOR EACH PRODUCT
  const checkout = async () => {
    if (cartItems.length === 0) return false;

    ;

    try {
      // 1. Save the order
      const orderRef = await addDoc(collection(db, "orders"), {
        items: cartItems,
        total: cartTotal,
        buyerEmail: user?.email || "guest@example.com",
        buyerName: user?.displayName || "Guest",
        status: "pending",
        createdAt: serverTimestamp()
      });

      // 2. Increment totalSold for each product (atomic & safe)
      const updatePromises = cartItems.map(item =>
        updateDoc(doc(db, "pricelists", item.id), {
          totalSold: increment(item.quantity)
        })
      );

      await Promise.all(updatePromises);

      // 3. Clear cart & celebrate
      clearCart();
      toast({ 
        title: "Order Placed!", 
        description: "Thank you! Your order has been received. Admin will contact you soon." 
      });
      return true;
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "Could not place order. Please try again." 
      });
      console.error("Checkout error:", err);
      return false;
    }
  };

  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      checkout,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);