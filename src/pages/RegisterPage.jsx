// src/pages/RegisterPage.jsx  ← FIXED WITH REAL FIREBASE AUTH
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';  // ← Real Firebase hook
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';  // ← Real Firebase auth
import { Button } from '@/components/ui/button';
import { Mail, Lock, User } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();  // ← From Firebase (only gets current user)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      navigate('/buyer-dashboard');  // Redirect to buyer dashboard after register
    } catch (err) {
      setError(err.message);  // Show error (e.g., "Email already in use")
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, redirect
  if (user) {
    navigate('/buyer-dashboard');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Register - D.A.B.S. Co.</title>
        <meta name="description" content="Create your D.A.B.S. Co. account to get started." />
      </Helmet>

      <div className="container mx-auto px-4 py-20 min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
        >
          <div className="bg-[#118C8C] p-6 text-center">
            <h1 className="text-3xl font-bold text-white">Create Account</h1>
            <p className="text-[#bcecec] mt-2">Join our artisan community</p>
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
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
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

              <Button type="submit" className="w-full bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold py-3" disabled={loading}>
                {loading ? 'Please wait...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#118C8C] font-semibold hover:underline">
                Log In
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default RegisterPage;