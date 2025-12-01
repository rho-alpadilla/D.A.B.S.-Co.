// src/context/CartContext.jsx ← FINAL VERSION WITH CHECKOUT
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase'; // or wherever your auth is

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { toast } = useToast();
  const { user } = useAuth(); // Get current user (optional for buyer name)

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

  // NEW: Save order to Firestore when buyer checks out
  const checkout = async () => {
    if (cartItems.length === 0) return false;

    try {
      await addDoc(collection(db, "orders"), {
        items: cartItems,
        total: cartTotal,
        buyerEmail: user?.email || "guest@example.com",
        buyerName: user?.displayName || "Guest",
        status: "pending",
        createdAt: serverTimestamp()
      });

      clearCart();
      toast({ title: "Order Placed!", description: "Thank you! Admin will contact you soon." });
      return true;
    } catch (err) {
      toast({ title: "Error", description: "Could not place order. Try again." });
      console.error(err);
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
      checkout,           // ← NEW: available everywhere
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);