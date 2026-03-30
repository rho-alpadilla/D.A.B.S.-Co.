// src/context/CartContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
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
import { db, useAuth } from '@/lib/firebase';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const LOCAL_CART_KEY = 'dabs_guest_cart';

  // Prevent save before correct cart source is loaded
  const hydratedRef = useRef(false);

  // Skip first save after cart source changes
  const skipNextSaveRef = useRef(false);

  // Read guest cart from localStorage
  const getGuestCart = () => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]');
    } catch (error) {
      console.error('Failed to read guest cart:', error);
      return [];
    }
  };

  // Save guest cart to localStorage
  const setGuestCart = (items) => {
    if (!items || items.length === 0) {
      localStorage.removeItem(LOCAL_CART_KEY);
    } else {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
    }
  };

  // Get logged-in user's Firestore cart
  const getFirestoreCart = async (uid) => {
    const cartRef = collection(db, 'users', uid, 'cart');
    const snap = await getDocs(cartRef);

    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  };

  // Delete all items in Firestore cart
  const clearFirestoreCart = async (uid) => {
    if (!uid) return;

    const cartRef = collection(db, 'users', uid, 'cart');
    const snap = await getDocs(cartRef);

    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  };

  // Replace Firestore cart with current items
  const overwriteFirestoreCart = async (uid, items) => {
    if (!uid) return;

    await clearFirestoreCart(uid);

    if (!items || items.length === 0) return;

    await Promise.all(
      items.map((item) =>
        setDoc(doc(db, 'users', uid, 'cart', item.id), item)
      )
    );
  };

  // Reusable cart loader
  const refreshCart = useCallback(
    async (overrideUid = null) => {
      const activeUid = overrideUid || user?.uid;

      if (authLoading && !overrideUid) return;

      skipNextSaveRef.current = true;
      setCartLoading(true);
      hydratedRef.current = false;

      try {
        if (activeUid) {
          const firestoreItems = await getFirestoreCart(activeUid);
          setCartItems(firestoreItems);
        } else {
          const guestCart = getGuestCart();
          setCartItems(guestCart);
        }
      } catch (err) {
        console.error('Cart load error:', err);
      } finally {
        hydratedRef.current = true;
        setCartLoading(false);
      }
    },
    [user?.uid, authLoading]
  );

  // Load correct cart source when auth changes
  useEffect(() => {
    if (authLoading) return;
    refreshCart();
  }, [refreshCart, authLoading]);

  // Save cart after correct source is loaded
  useEffect(() => {
    if (authLoading || cartLoading || !hydratedRef.current) return;

    // Skip first auto-save after reload
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    const saveCart = async () => {
      try {
        if (user?.uid) {
          await overwriteFirestoreCart(user.uid, cartItems);
        } else {
          setGuestCart(cartItems);
        }
      } catch (err) {
        console.error('Cart save error:', err);
      }
    };

    saveCart();
  }, [cartItems, user?.uid, authLoading, cartLoading]);

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);

      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 0) + quantity }
            : item
        );
      }

      return [...prev, { ...product, quantity }];
    });

    toast({
      title: 'Added!',
      description: `${product.name} added to cart.`,
    });
  };

  // Remove item
  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update quantity
  const updateQuantity = (id, qty) => {
    if (qty < 1) return;

    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      )
    );
  };

  // Clear cart
  const clearCart = async () => {
    setCartItems([]);

    try {
      if (user?.uid) {
        await clearFirestoreCart(user.uid);
      } else {
        localStorage.removeItem(LOCAL_CART_KEY);
      }
    } catch (err) {
      console.error('Clear cart error:', err);
    }
  };

  // Total price
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );

  // Total quantity
  const cartCount = cartItems.reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  // Checkout
  const checkout = async () => {
    if (cartItems.length === 0 || !user?.uid) {
      toast({
        title: 'Error',
        description: 'Cart empty or not logged in.',
      });
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

      const updatePromises = cartItems.map((item) =>
        updateDoc(doc(db, 'pricelists', item.id), {
          totalSold: increment(item.quantity || 0),
        })
      );

      await Promise.all(updatePromises);
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
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }

  return context;
};