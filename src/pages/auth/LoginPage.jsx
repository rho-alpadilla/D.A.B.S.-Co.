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
import SocialSignInButtons from '@/components/auth/SocialSignInButtons';
import { getAuthenticationErrorMessage } from '@/lib/authProviders';

const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const LOCAL_CART_KEY = 'dabs_guest_cart';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getGuestCart = () => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]');
    } catch (error) {
      console.error('Failed to read guest cart:', error);
      return [];
    }
  };

  const getFirestoreCart = async (uid) => {
    const cartRef = collection(db, 'users', uid, 'cart');
    const snap = await getDocs(cartRef);

    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  };

  const clearFirestoreCart = async (uid) => {
    const cartRef = collection(db, 'users', uid, 'cart');
    const snap = await getDocs(cartRef);
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
  };

  const mergeAndSaveCart = async (uid, guestItems) => {
    const existingItems = await getFirestoreCart(uid);
    const mergedMap = new Map();

    existingItems.forEach((item) => {
      mergedMap.set(item.id, { ...item });
    });

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

    await clearFirestoreCart(uid);

    if (mergedItems.length === 0) return;

    await Promise.all(
      mergedItems.map((item) =>
        setDoc(doc(db, 'users', uid, 'cart', item.id), item)
      )
    );
  };

  const completeLogin = async (loggedInUser) => {
    const guestCart = getGuestCart();

    if (guestCart.length > 0 && loggedInUser?.uid) {
      await mergeAndSaveCart(loggedInUser.uid, guestCart);
      localStorage.removeItem(LOCAL_CART_KEY);
    }

    await refreshCart(loggedInUser.uid);

    const isAdmin = loggedInUser.email?.toLowerCase().includes('admin');
    navigate(isAdmin ? '/admin-panel' : '/gallery', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await completeLogin(userCredential.user);
    } catch (err) {
      setError(getAuthenticationErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSuccess = async (socialUser) => {
    setLoading(true);
    setError('');
    try {
      await completeLogin(socialUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - D.A.B.S. Co.</title>
      </Helmet>

      <div className="artisan-grid-page relative min-h-screen overflow-hidden">

        <div className="relative z-10 container mx-auto flex min-h-[80vh] items-center justify-center px-5 py-12 sm:px-6 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/45 bg-white/95 shadow-2xl shadow-[#2D0E5A]/30 backdrop-blur-md md:grid-cols-[0.82fr_1.18fr]"
          >
            <div className="relative flex overflow-hidden p-7 text-center text-white sm:p-10 md:text-left" style={{ background: 'linear-gradient(135deg, #2D0E5A, #5C2D91)' }}>
              <div className="absolute inset-0 pointer-events-none opacity-15">
                <div className="absolute -top-10 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-10 left-0 w-40 h-40 bg-artisan-primary-pale rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 my-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-4">
                  Welcome Back
                </div>

                <h1 className="font-artisan-display text-4xl font-bold text-white md:text-5xl">Log In</h1>
                <p className="mt-3 leading-7 text-white/85">Sign in to continue your D.A.B.S. experience.</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 md:p-10">
              {error && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#342342]" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B3FA0]" size={18} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full rounded-2xl border border-[#DCCBE7] bg-[#FFFCFA] py-3 pl-11 pr-4 text-[#2A1739] transition-[border-color,box-shadow] duration-200 focus:border-[#5C2D91] focus:outline-none focus:ring-4 focus:ring-[#5C2D91]/15"
                      placeholder="admin@dabs.co"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="text-xs italic text-artisan-text-muted">
                    Hint: Use &apos;admin@dabs.co&apos; for Admin Panel
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#342342]" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B3FA0]" size={18} />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="w-full rounded-2xl border border-[#DCCBE7] bg-[#FFFCFA] py-3 pl-11 pr-4 text-[#2A1739] transition-[border-color,box-shadow] duration-200 focus:border-[#5C2D91] focus:outline-none focus:ring-4 focus:ring-[#5C2D91]/15"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="text-right">
                    <Link to="/forgot-password" className="text-sm font-semibold text-[#5C2D91] hover:underline">Forgot password?</Link>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-14 w-full rounded-2xl text-base font-bold text-white transition-[transform,filter,box-shadow] duration-200 hover:-translate-y-0.5 hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #5C2D91, #7B3FA0)', boxShadow: '0 8px 24px rgba(92,45,145,0.28)' }}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#766880] before:h-px before:flex-1 before:bg-[#E6DDEB] after:h-px after:flex-1 after:bg-[#E6DDEB]">
                Or continue with
              </div>
              <SocialSignInButtons onSuccess={handleSocialSuccess} onError={setError} disabled={loading} />

              <div className="mt-6 text-center text-sm text-artisan-text-muted">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-artisan-primary font-semibold hover:underline">
                  Register
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
