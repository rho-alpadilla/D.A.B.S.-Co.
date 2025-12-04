// src/components/Header.jsx ← FINAL: NO MORE DROPDOWN CONFLICT
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, LogOut, Settings, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);   // ← NEW
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);   // ← NEW
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const authData = useAuth();
  const user = authData?.user || null;
  const loading = authData?.loading || false;
  const { cartCount } = useCart();
  const { currency, setCurrency, CURRENCIES } = useCurrency();

  // Read admin role
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const userDoc = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDoc, (docSnap) => {
      if (docSnap.exists() && docSnap.data().role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });

    return unsubscribe;
  }, [user]);

  const baseNavLinks = [
    { path: '/', label: 'Home' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/pricelists', label: 'Pricing' },
  ];
  const customerNavLinks = [
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];
  const navLinks = isAdmin ? baseNavLinks : [...baseNavLinks, ...customerNavLinks];
  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await signOut(auth);
    setIsCurrencyOpen(false);
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  if (loading) return null;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl md:text-3xl font-bold text-[#118C8C] hover:text-[#0d7070] transition-colors">
            D.A.B.S. Co.
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-lg font-medium transition-colors relative ${
                  isActive(link.path) ? 'text-[#118C8C8C]' : 'text-gray-700 hover:text-[#118C8C]'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#F2BB16]"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}

            {/* Right Side */}
            <div className="flex items-center gap-6">
              {/* Currency Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                >
                  <Globe size={18} />
                  <span className="font-medium">
                    {CURRENCIES.find(c => c.code === currency)?.symbol} {currency}
                  </span>
                </button>

                <AnimatePresence>
                  {isCurrencyOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                    >
                      {CURRENCIES.map(curr => (
                        <button
                          key={curr.code}
                          onClick={() => {
                            setCurrency(curr.code);
                            setIsCurrencyOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3 ${
                            currency === curr.code ? 'bg-[#118C8C]/10 font-bold' : ''
                          }`}
                        >
                          <span className="text-xl">{curr.symbol}</span>
                          <span>{curr.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Cart — hidden for admin */}
              {!isAdmin && (
                <Link to="/cart" className="relative text-gray-700 hover:text-[#118C8C] transition">
                  <ShoppingCart size={24} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#F2BB16] text-xs font-bold text-gray-900 rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User Avatar + Dropdown */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 rounded-full hover:bg-gray-100 px-3 py-2 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#118C8C] flex items-center justify-center text-white font-bold text-lg">
                      {user.email[0].toUpperCase()}
                    </div>
                    {isAdmin && (
                      <span className="hidden lg:block bg-amber-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                        Admin
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-[9999]"
                      >
                        <div className="p-4 bg-gradient-to-br from-[#118C8C]/5 to-transparent border-b border-gray-100">
                          <p className="font-semibold text-gray-900">{user.email}</p>
                          {isAdmin && <span className="text-xs font-bold text-amber-600">Administrator</span>}
                        </div>
                        <Link
                          to={isAdmin ? '/admin-panel' : '/buyer-dashboard'}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition"
                        >
                          <Settings size={18} />
                          Dashboard
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 transition text-left"
                        >
                          <LogOut size={18} />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-700 hover:text-[#118C8C]">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900">
                      Join
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex items-center gap-4 text-[#118C8C]"
          >
            {!isAdmin && (
              <Link to="/cart" onClick={(e) => e.stopPropagation()} className="relative">
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#F2BB16] text-xs font-bold text-gray-900 rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 space-y-3 bg-white pb-4"
            >
              {/* Currency in Mobile */}
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-600 mb-2">Currency</p>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg bg-white"
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block py-3 px-4 rounded-lg text-lg font-medium transition ${
                    isActive(link.path) ? 'bg-[#118C8C] text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {user && (
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="px-4 py-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{user.email}</p>
                    {isAdmin && <span className="text-xs text-amber-600 font-bold">Admin</span>}
                  </div>
                  <Link
                    to={isAdmin ? '/admin-panel' : '/buyer-dashboard'}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-[#118C8C] font-medium hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-600 font-medium hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;