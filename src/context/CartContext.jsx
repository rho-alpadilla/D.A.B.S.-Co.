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
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, useAuth } from '@/lib/firebase';
import {
  getAvailableStock,
  getStockValidationMessage,
} from '@/lib/stock';
import { getProductImageUrl } from '@/lib/catalog/productImages';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [customOrderRequest, setCustomOrderRequest] = useState(null);

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Prevent save before correct cart source is loaded
  const hydratedRef = useRef(false);

  // Skip first save after cart source changes
  const skipNextSaveRef = useRef(false);
  const loadedOwnerRef = useRef(null);
  const guestCartRef = useRef([]);
  const cartTransferRef = useRef(null);

  // Guest carts intentionally live in memory only. This prevents shared carts
  // across browser contexts and clears the cart after a refresh.
  useEffect(() => {
    localStorage.removeItem('dabs_guest_cart');
  }, []);

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

      if (activeUid && cartTransferRef.current?.uid === activeUid) {
        return cartTransferRef.current.promise;
      }

      skipNextSaveRef.current = true;
      setCartLoading(true);
      hydratedRef.current = false;
      loadedOwnerRef.current = null;

      try {
        if (activeUid) {
          const firestoreItems = await getFirestoreCart(activeUid);
          setCartItems(firestoreItems);
        } else {
          setCartItems(guestCartRef.current);
        }
      } catch (err) {
        console.error('Cart load error:', err);
      } finally {
        hydratedRef.current = true;
        loadedOwnerRef.current = activeUid || 'guest';
        setCartLoading(false);
      }
    },
    [user?.uid, authLoading]
  );

  const mergeGuestCartIntoUserCart = useCallback(async (uid) => {
    if (!uid) throw new Error('A signed-in account is required to transfer a guest cart.');

    if (cartTransferRef.current?.uid === uid) {
      return cartTransferRef.current.promise;
    }

    const guestItems = guestCartRef.current;
    if (guestItems.length === 0) {
      await refreshCart(uid);
      return [];
    }

    const transferPromise = (async () => {
      skipNextSaveRef.current = true;
      setCartLoading(true);
      hydratedRef.current = false;
      loadedOwnerRef.current = null;

      try {
        const savedItems = await getFirestoreCart(uid);
        const mergedItemsById = new Map(savedItems.map((item) => [item.id, { ...item }]));

        guestItems.forEach((guestItem) => {
          const savedItem = mergedItemsById.get(guestItem.id);
          mergedItemsById.set(guestItem.id, savedItem
            ? {
                ...savedItem,
                imageUrl: getProductImageUrl(guestItem) || getProductImageUrl(savedItem),
                imageUrls: guestItem.imageUrls || savedItem.imageUrls,
                quantity: (Number(savedItem.quantity) || 0) + (Number(guestItem.quantity) || 0),
              }
            : { ...guestItem, imageUrl: getProductImageUrl(guestItem) });
        });

        const mergedItems = Array.from(mergedItemsById.values());
        await overwriteFirestoreCart(uid, mergedItems);
        guestCartRef.current = [];
        setCartItems(mergedItems);
        return mergedItems;
      } finally {
        hydratedRef.current = true;
        loadedOwnerRef.current = uid;
        setCartLoading(false);
      }
    })();

    cartTransferRef.current = { uid, promise: transferPromise };

    try {
      return await transferPromise;
    } finally {
      if (cartTransferRef.current?.promise === transferPromise) {
        cartTransferRef.current = null;
      }
    }
  }, [refreshCart]);

  // Load correct cart source when auth changes
  useEffect(() => {
    if (authLoading) return;
    refreshCart();
  }, [refreshCart, authLoading]);

  // Save cart after correct source is loaded
  useEffect(() => {
    if (authLoading || cartLoading || !hydratedRef.current) return;

    const expectedOwner = user?.uid || 'guest';
    if (loadedOwnerRef.current !== expectedOwner) return;

    // Skip first auto-save after reload
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    const saveCart = async () => {
      try {
        if (user?.uid) await overwriteFirestoreCart(user.uid, cartItems);
      } catch (err) {
        console.error('Cart save error:', err);
      }
    };

    saveCart();
  }, [cartItems, user?.uid, authLoading, cartLoading]);

  const validateCartItems = useCallback(async (items) => {
    const itemsToValidate = Array.isArray(items) ? items : [];

    const results = await Promise.all(
      itemsToValidate.map(async (item) => {
        if (!item?.id) {
          return {
            issue: 'A cart item is missing its product reference.',
            item: null,
          };
        }

        const productSnapshot = await getDoc(doc(db, 'pricelists', item.id));

        if (!productSnapshot.exists()) {
          return {
            issue: `${item.name || 'A product'} is no longer available.`,
            item: null,
          };
        }

        const product = { id: productSnapshot.id, ...productSnapshot.data() };
        const availableStock = getAvailableStock(product);
        const requestedQuantity = Math.max(1, Math.floor(Number(item.quantity) || 1));

        if (requestedQuantity > availableStock) {
          return {
            issue: getStockValidationMessage({
              name: product.name || item.name,
              availableStock,
            }),
            item: null,
          };
        }

        return {
          issue: null,
          item: {
            ...item,
            name: product.name || item.name,
            imageUrl: getProductImageUrl(product) || getProductImageUrl(item),
            imageUrls: product.imageUrls || item.imageUrls,
            category: product.category || item.category,
            inStock: product.inStock !== false,
            stockQuantity: availableStock,
            quantity: requestedQuantity,
          },
        };
      })
    );

    const issues = results
      .map((result) => result.issue)
      .filter(Boolean);

    return {
      isValid: issues.length === 0,
      issues,
      items: results.map((result) => result.item).filter(Boolean),
    };
  }, []);

  const openCustomOrderRequest = useCallback((product, requestedQuantity) => {
    setCustomOrderRequest({
      productId: product.id,
      productName: product.name || 'Selected product',
      productImage: getProductImageUrl(product),
      availableStock: getAvailableStock(product),
      requestedQuantity: Math.max(1, Number(requestedQuantity) || 1),
    });
  }, []);

  const closeCustomOrderRequest = useCallback(() => setCustomOrderRequest(null), []);

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    const availableStock = getAvailableStock(product);
    const requestedQuantity = Math.max(1, Math.floor(Number(quantity) || 1));
    const existingItem = cartItems.find((item) => item.id === product?.id);
    const existingQuantity = Number(existingItem?.quantity) || 0;
    const quantityToAdd = Math.min(
      requestedQuantity,
      Math.max(0, availableStock - existingQuantity)
    );

    if (quantityToAdd === 0) {
      openCustomOrderRequest(product, Math.max(availableStock + 1, existingQuantity + requestedQuantity));
      return false;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      const productImageUrl = getProductImageUrl(product);

      if (existing) {
        const nextItems = prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                ...product,
                imageUrl: productImageUrl || getProductImageUrl(item),
                stockQuantity: availableStock,
                quantity: (item.quantity || 0) + quantityToAdd,
              }
            : item
        );
        if (!user?.uid) guestCartRef.current = nextItems;
        return nextItems;
      }

      const nextItems = [
        ...prev,
        {
          ...product,
          imageUrl: productImageUrl,
          stockQuantity: availableStock,
          quantity: quantityToAdd,
        },
      ];
      if (!user?.uid) guestCartRef.current = nextItems;
      return nextItems;
    });

    toast({
      title: quantityToAdd < requestedQuantity ? 'Quantity adjusted' : 'Added to cart',
      description:
        quantityToAdd < requestedQuantity
          ? getStockValidationMessage({ name: product.name, availableStock })
          : `${product.name} added to cart.`,
    });

    return true;
  };

  // Remove item
  const removeFromCart = (id) => {
    setCartItems((prev) => {
      const nextItems = prev.filter((item) => item.id !== id);
      if (!user?.uid) guestCartRef.current = nextItems;
      return nextItems;
    });
  };

  // Update quantity
  const updateQuantity = (id, qty) => {
    const item = cartItems.find((cartItem) => cartItem.id === id);

    if (!item) return false;

    const availableStock = getAvailableStock(item);
    const requestedQuantity = Math.max(1, Math.floor(Number(qty) || 1));
    const nextQuantity = Math.min(requestedQuantity, availableStock);

    if (nextQuantity < 1) {
      openCustomOrderRequest(item, requestedQuantity);
      return false;
    }

    setCartItems((prev) => {
      const nextItems = prev.map((item) =>
        item.id === id ? { ...item, quantity: nextQuantity } : item
      );
      if (!user?.uid) guestCartRef.current = nextItems;
      return nextItems;
    });

    if (nextQuantity < requestedQuantity) {
      openCustomOrderRequest(item, requestedQuantity);
    }

    return true;
  };

  // Clear cart
  const clearCart = async () => {
    setCartItems([]);
    guestCartRef.current = [];

    try {
      if (user?.uid) {
        await clearFirestoreCart(user.uid);
      }
      return true;
    } catch (err) {
      console.error('Clear cart error:', err);
      return false;
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
      const validation = await validateCartItems(cartItems);

      if (!validation.isValid) {
        toast({
          title: 'Stock changed',
          description: validation.issues[0],
          variant: 'destructive',
        });
        return false;
      }

      const validatedTotal = validation.items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
      );

      await addDoc(collection(db, 'orders'), {
        items: validation.items,
        total: validatedTotal,
        buyerEmail: user.email,
        buyerName: user.displayName || user.email.split('@')[0],
        status: 'pending',
        createdAt: serverTimestamp(),
      });

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
        mergeGuestCartIntoUserCart,
        validateCartItems,
        customOrderRequest,
        openCustomOrderRequest,
        closeCustomOrderRequest,
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
