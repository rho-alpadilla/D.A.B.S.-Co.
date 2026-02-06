// src/pages/LoginPage.jsx ← UPDATED: non-admin redirects to /gallery (admin still to /admin-panel)
// ✅ Also fixed: no navigate() during render (moved to useEffect)

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ If already logged in → redirect
  useEffect(() => {
    if (!user) return;
    const isAdmin = (user.email || "").toLowerCase().includes('admin');
    navigate(isAdmin ? '/admin-panel' : '/gallery', { replace: true });
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      // ✅ Same admin check (kept consistent with your setup)
      const isAdmin = formData.email.toLowerCase().includes('admin');

      // ✅ Redirect correctly: admin → admin panel, everyone else → gallery
      navigate(isAdmin ? '/admin-panel' : '/gallery', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Optional: while redirecting logged-in users, render nothing
  if (user) return null;

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
                <label className="text-sm font-medium text-gray-700" htmlFor="email">Email Address</label>
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
                <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
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
                Register as a Buyer
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
