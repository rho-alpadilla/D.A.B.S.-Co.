import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock login logic
    // In a real app, this would validate against a backend
    
    // Mock Admin check: If email contains 'admin', treat as Admin
    const role = formData.email.toLowerCase().includes('admin') ? 'admin' : 'buyer';
    
    const user = {
      name: formData.email.split('@')[0], // Mock name from email
      email: formData.email,
      role: role
    };
    
    login(user);
    
    // Redirect based on role
    if (role === 'admin') {
      navigate('/admin-panel');
    } else {
      navigate('/buyer-dashboard');
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - D.A.B.S. Co.</title>
        <meta name="description" content="Log in to your D.A.B.S. Co. account." />
      </Helmet>

      <div className="container mx-auto px-4 py-20 min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
        >
          <div className="bg-[#118C8C] p-6 text-center">
            <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
            <p className="text-[#bcecec] mt-2">Log in to continue</p>
          </div>

          <div className="p-8">
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#118C8C] focus:border-transparent"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <p className="text-xs text-gray-400 italic">
                  (Hint: Use 'admin@dabsco.com' to test Admin Panel)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700" htmlFor="password">Password</label>
                  <a href="#" className="text-xs text-[#118C8C] hover:underline">Forgot Password?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#118C8C] focus:border-transparent"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold py-3">
                Log In
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