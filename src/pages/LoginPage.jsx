// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Grainient from '@/components/ui-bits/Grainient';
import Particles from '@/components/ui-bits/Particles';

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

      if (guestCart.length > 0 && loggedInUser?.uid) {
        await mergeAndSaveCart(loggedInUser.uid, guestCart);
        localStorage.removeItem(LOCAL_CART_KEY);
      }

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

      <div className="relative min-h-screen bg-[#daf0ee] overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#118c8c"
            color2="#118c8c"
            color3="#fbfe9f"
            timeSpeed={0.25}
            colorBalance={-0.06}
            warpStrength={1.5}
            warpFrequency={3.8}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={1}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />

          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={400}
              particleSpread={10}
              speed={0.1}
              particleColors={['#faf8f1', '#118c8c', '#f1bb19']}
              moveParticlesOnHover
              particleHoverFactor={1}
              alphaParticles={false}
              particleBaseSize={150}
              sizeRandomness={1.7}
              cameraDistance={53}
              disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20 min-h-[80vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden border border-white/30"
          >
            <div className="bg-[#118C8C]/95 p-8 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -top-10 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                <div className="absolute -bottom-10 left-0 w-40 h-40 bg-[#F2BB16] rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-4">
                  <Sparkles size={14} />
                  Welcome Back
                </div>

                <h1 className="text-3xl font-bold text-white">Log In</h1>
                <p className="text-[#bcecec] mt-2">Sign in to continue your D.A.B.S. experience</p>
              </div>
            </div>

            <div className="p-8">
              {error && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#118C8C] bg-white"
                      placeholder="admin@dabs.co"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <p className="text-xs text-gray-400 italic">
                    Hint: Use &apos;admin@dabs.co&apos; for Admin Panel
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#118C8C] bg-white"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold py-6 rounded-2xl text-base"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-[#118C8C] font-semibold hover:underline">
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