// src/context/CartContext.jsx ← FIXED: PER-USER PERSISTENCE (FIRESTORE FOR LOGGED-IN, LOCALSTORAGE FOR GUESTS, MERGE ON LOGIN)
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // LocalStorage key for guests
  const LOCAL_CART_KEY = 'dabs_guest_cart';

  // Load cart from localStorage (guests) or Firestore (logged-in)
  useEffect(() => {
    if (authLoading) return;

    const loadCart = async () => {
      if (user) {
        // Logged-in: load from Firestore
        const cartRef = collection(db, 'users', user.uid, 'cart');
        const snap = await getDocs(cartRef);
        const firestoreItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCartItems(firestoreItems);

        // Merge guest cart if any exists
        const guestCart = JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]');
        if (guestCart.length > 0) {
          // Merge logic: add guest items not already in Firestore
          const merged = [...firestoreItems];
          guestCart.forEach(guestItem => {
            const exists = merged.some(i => i.id === guestItem.id);
            if (!exists) merged.push(guestItem);
            else {
              // If exists, add quantities
              merged.forEach(i => {
                if (i.id === guestItem.id) i.quantity += guestItem.quantity;
              });
            }
          });
          setCartItems(merged);

          // Save merged to Firestore
          merged.forEach(async item => {
            await setDoc(doc(db, 'users', user.uid, 'cart', item.id), item);
          });

          // Clear guest localStorage after merge
          localStorage.removeItem(LOCAL_CART_KEY);
          toast({ title: "Cart Updated", description: "Guest items merged into your account." });
        }
      } else {
        // Guest: load from localStorage
        const saved = localStorage.getItem(LOCAL_CART_KEY);
        if (saved) setCartItems(JSON.parse(saved));
      }
    };

    loadCart();
  }, [user, authLoading]);

  // Save to localStorage for guests, Firestore for logged-in
  useEffect(() => {
    if (!cartItems.length) return;

    if (user) {
      // Logged-in: sync to Firestore
      cartItems.forEach(async item => {
        await setDoc(doc(db, 'users', user.uid, 'cart', item.id), item);
      });
    } else {
      // Guest: save to localStorage
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

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
    if (user) {
      // Also delete from Firestore
      deleteDoc(doc(db, 'users', user.uid, 'cart', id));
    }
  };

  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => {
    setCartItems([]);
    if (user) {
      // Clear Firestore cart subcollection (optional - careful!)
      // For now, we don't clear Firestore on clearCart to avoid accidents
      // If you want, add a batch delete here
    } else {
      localStorage.removeItem(LOCAL_CART_KEY);
    }
  };

  // Checkout: only for logged-in (guest checkout can be added later)
  const checkout = async () => {
    if (cartItems.length === 0 || !user) {
      toast({ title: "Error", description: "Cart empty or not logged in." });
      return false;
    }

    try {
      const orderRef = await addDoc(collection(db, "orders"), {
        items: cartItems,
        total: cartTotal,
        buyerEmail: user.email,
        buyerName: user.displayName || "User",
        status: "pending",
        createdAt: serverTimestamp()
      });

      // Increment totalSold
      const updatePromises = cartItems.map(item =>
        updateDoc(doc(db, "pricelists", item.id), {
          totalSold: increment(item.quantity)
        })
      );
      await Promise.all(updatePromises);

      // Clear cart after success
      clearCart();
      toast({ 
        title: "Order Placed!", 
        description: "Thank you! Your order has been received." 
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