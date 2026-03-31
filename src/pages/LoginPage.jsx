// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Mail, Lock } from 'lucide-react';
import { useCart } from '@/context/CartContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const LOCAL_CART_KEY = 'dabs_guest_cart';

  // Update form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Read guest cart from localStorage
  const getGuestCart = () => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]');
    } catch (error) {
      console.error('Failed to read guest cart:', error);
      return [];
    }
  };

  // Read existing Firestore cart
  const getFirestoreCart = async (uid) => {
    const cartRef = collection(db, 'users', uid, 'cart');
    const snap = await getDocs(cartRef);

    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  };

  // Clear all items in Firestore cart
  const clearFirestoreCart = async (uid) => {
    const cartRef = collection(db, 'users', uid, 'cart');
    const snap = await getDocs(cartRef);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  };

  // Merge guest cart with existing Firestore cart
  const mergeAndSaveCart = async (uid, guestItems) => {
    const existingItems = await getFirestoreCart(uid);
    const mergedMap = new Map();

    // Keep existing user cart items
    existingItems.forEach((item) => {
      mergedMap.set(item.id, { ...item });
    });

    // Add guest items, or combine quantity if item already exists
    guestItems.forEach((item) => {
      if (mergedMap.has(item.id)) {
        const existing = mergedMap.get(item.id);
        mergedMap.set(item.id, {
          ...existing,
          quantity: (existing.quantity || 0) + (item.quantity || 0),
        });
      } else {
        mergedMap.set(item.id, { ...item });
      }
    });

    const mergedItems = Array.from(mergedMap.values());

    // Rewrite Firestore cart with merged result
    await clearFirestoreCart(uid);

    if (mergedItems.length === 0) return;

    await Promise.all(
      mergedItems.map((item) =>
        setDoc(doc(db, 'users', uid, 'cart', item.id), item)
      )
    );
  };

  // Handle login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const guestCart = getGuestCart();

      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const loggedInUser = userCredential.user;

      // Merge guest cart into the logged-in user's cart
      if (guestCart.length > 0 && loggedInUser?.uid) {
        await mergeAndSaveCart(loggedInUser.uid, guestCart);
        localStorage.removeItem(LOCAL_CART_KEY);
      }

      // Refresh cart UI immediately
      await refreshCart(loggedInUser.uid);

      const isAdmin = formData.email.toLowerCase().includes('admin');
      navigate(isAdmin ? '/admin-panel' : '/gallery', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - D.A.B.S. Co.</title>
      </Helmet>

      <div className="container mx-auto px-4 py-20 min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
        >
          <div className="bg-[#118C8C] p-6 text-center">
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
            <p className="text-[#bcecec] mt-2">Log in to continue</p>
          </div>

          <div className="p-8">
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#118C8C]"
                    placeholder="admin@dabs.co"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <p className="text-xs text-gray-400 italic">
                  Hint: Use 'admin@dabs.co' for Admin Panel
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#118C8C]"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold py-3"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#118C8C] font-semibold hover:underline">
                Register
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;