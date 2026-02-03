// src/context/CartContext.jsx ← FIXED: Prevent cross-user cart leak + proper clear + safe sync
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
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/firebase';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true); // ✅ prevents bad sync during auth switch
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const LOCAL_CART_KEY = 'dabs_guest_cart';

  // Helper: delete ALL items in a user's Firestore cart
  const clearFirestoreCart = async (uid) => {
    if (!uid) return;
    const cartRef = collection(db, 'users', uid, 'cart');
    const snap = await getDocs(cartRef);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  };

  // ✅ Load cart when auth state changes (IMPORTANT: reset immediately to avoid leak)
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    const loadCart = async () => {
      setCartLoading(true);

      // ✅ Reset immediately when user changes so old cart doesn't flash / get synced
      setCartItems([]);

      try {
        if (user?.uid) {
          // Logged-in: load from Firestore
          const cartRef = collection(db, 'users', user.uid, 'cart');
          const snap = await getDocs(cartRef);
          const firestoreItems = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

          // Merge guest cart if any exists
          const guestCart = JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]');

          let merged = [...firestoreItems];

          if (guestCart.length > 0) {
            guestCart.forEach((guestItem) => {
              const existing = merged.find((i) => i.id === guestItem.id);
              if (!existing) {
                merged.push(guestItem);
              } else {
                existing.quantity = (existing.quantity || 0) + (guestItem.quantity || 0);
              }
            });

            // Save merged to Firestore
            await Promise.all(
              merged.map((item) =>
                setDoc(doc(db, 'users', user.uid, 'cart', item.id), item, { merge: true })
              )
            );

            // Clear guest cart after merge
            localStorage.removeItem(LOCAL_CART_KEY);

            toast({
              title: 'Cart Updated',
              description: 'Guest items merged into your account.',
            });
          }

          if (!cancelled) setCartItems(merged);
        } else {
          // Guest: load from localStorage
          const saved = JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]');
          if (!cancelled) setCartItems(saved);
        }
      } catch (err) {
        console.error('Cart load error:', err);
      } finally {
        if (!cancelled) setCartLoading(false);
      }
    };

    loadCart();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, authLoading]); // ✅ ONLY depends on uid changes

  // ✅ Sync cart AFTER it has loaded (prevents writing old cart into new user)
  useEffect(() => {
    if (authLoading || cartLoading) return;

    const sync = async () => {
      try {
        if (user?.uid) {
          // Logged-in: sync to Firestore
          // (Only upsert current items; removals handled by removeFromCart / clearCart)
          await Promise.all(
            cartItems.map((item) =>
              setDoc(doc(db, 'users', user.uid, 'cart', item.id), item, { merge: true })
            )
          );
        } else {
          // Guest: always sync localStorage (even when empty)
          if (cartItems.length === 0) localStorage.removeItem(LOCAL_CART_KEY);
          else localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cartItems));
        }
      } catch (err) {
        console.error('Cart sync error:', err);
      }
    };

    sync();
  }, [cartItems, user?.uid, authLoading, cartLoading]);

  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === product.id);
      if (exists) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: (i.quantity || 0) + quantity } : i
        );
      }
      return [...prev, { ...product, quantity }];
    });

    toast({ title: 'Added!', description: `${product.name} added to cart.` });
  };

  const removeFromCart = async (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));

    // Also delete from Firestore for logged-in users
    if (user?.uid) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'cart', id));
      } catch (err) {
        console.error('Remove Firestore cart item failed:', err);
      }
    }
  };

  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const clearCart = async () => {
    setCartItems([]);

    if (user?.uid) {
      // ✅ Actually clear Firestore cart so it doesn't "come back" on reload
      try {
        await clearFirestoreCart(user.uid);
      } catch (err) {
        console.error('Clear Firestore cart failed:', err);
      }
    } else {
      localStorage.removeItem(LOCAL_CART_KEY);
    }
  };

  const cartTotal = cartItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 0), 0);
  const cartCount = cartItems.reduce((sum, i) => sum + (i.quantity || 0), 0);

  // Checkout: only for logged-in
  const checkout = async () => {
    if (cartItems.length === 0 || !user?.uid) {
      toast({ title: 'Error', description: 'Cart empty or not logged in.' });
      return false;
    }

    try {
      await addDoc(collection(db, 'orders'), {
        items: cartItems,
        total: cartTotal,
        buyerEmail: user.email,
        buyerName: user.displayName || user.email.split('@')[0],
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Increment totalSold
      const updatePromises = cartItems.map((item) =>
        updateDoc(doc(db, 'pricelists', item.id), {
          totalSold: increment(item.quantity || 0),
        })
      );
      await Promise.all(updatePromises);

      // ✅ Clear cart after success (also clears Firestore now)
      await clearCart();

      toast({
        title: 'Order Placed!',
        description: 'Thank you! Your order has been received.',
      });

      return true;
    } catch (err) {
      console.error('Checkout error:', err);
      toast({
        title: 'Error',
        description: 'Could not place order. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkout,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
