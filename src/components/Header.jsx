// src/components/Header.jsx ← FINAL: PROFILE PIC UPDATES INSTANTLY
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  ShoppingCart,
  LogOut,
  Settings,
  Globe,
  Search,
  User,
  ChevronDown, // ✅ added
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [photoURL, setPhotoURL] = useState(""); // ← LIVE PROFILE PIC
  const location = useLocation();
  const navigate = useNavigate();

  const authData = useAuth();
  const user = authData?.user || null;
  const loading = authData?.loading || false;
  const { cartCount } = useCart();
  const { currency, setCurrency, CURRENCIES } = useCurrency();

  const filteredCurrencies = CURRENCIES.filter(curr =>
    curr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    curr.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ selected currency label for the trigger (like: "United States | USD $")
  const selectedCurr = CURRENCIES.find(c => c.code === currency);
  const selectedCountryLabel = selectedCurr?.country || selectedCurr?.name || currency;
  const selectedRightLabel = `${selectedCurr?.code || currency} ${selectedCurr?.symbol || ""}`.trim();

  // Listen to user document for photoURL changes
  useEffect(() => {
    if (!user) {
      setPhotoURL("");
      setIsAdmin(false);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPhotoURL(data.photoURL || "");
        setIsAdmin(data.role === 'admin');
      }
    });

    return unsub;
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
    <header
      className="
        relative isolate sticky top-0 z-50
        bg-white/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/50
        after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-20
        after:bg-gradient-to-b after:from-white/35 after:to-transparent
        after:z-0
      "
    >
      <nav className="relative z-10 container mx-auto px-4 py-4">
        <div className="relative flex items-center">
          {/* Desktop Navigation — CENTERED */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent
                  text-lg font-medium transition-colors relative ${
                    isActive(link.path) ? 'text-[#118C8C]' : 'text-gray-700 hover:text-[#118C8C]'
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
          </div>

          {/* Right Side (pinned right) */}
          <div className="hidden md:flex items-center gap-6 ml-auto">
            {/* ✅ Currency Trigger — like 3rd photo: "United States | USD $" always visible */}
            <div className="relative">
              <button
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className="
                  flex items-center gap-2
                  px-3 py-2
                  rounded
                  bg-white/70 hover:bg-white/80
                  border border-gray-200
                  shadow-sm
                  transition
                "
              >
                <Globe size={16} className="text-gray-700" />
                <span className="text-sm text-gray-800 whitespace-nowrap">
                  {selectedCountryLabel} <span className="text-gray-400">|</span> {selectedRightLabel}
                </span>
                <ChevronDown size={16} className="text-gray-600" />
              </button>

              <AnimatePresence>
                {isCurrencyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          placeholder="Search currency..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#118C8C] focus:border-transparent"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Dropdown rows: show CODE+symbol only on row hover (like your earlier request) */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredCurrencies.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-500">No results</p>
                      ) : (
                        filteredCurrencies.map(curr => (
                          <button
                            key={curr.code}
                            onClick={() => {
                              setCurrency(curr.code);
                              setIsCurrencyOpen(false);
                              setSearchQuery("");
                            }}
                            title={`${curr.name} (${curr.code})`}
                            className="
                              group w-full
                              px-4 py-2
                              flex items-center justify-between
                              text-sm text-left
                              hover:bg-gray-50
                              transition
                            "
                          >
                            <span className="text-gray-800 truncate">
                              {curr.country || curr.name}
                            </span>

                            <span
                              className="
                                flex items-center gap-2
                                text-gray-700
                                opacity-0
                                group-hover:opacity-100
                                transition-opacity
                              "
                            >
                              <span className="tabular-nums">{curr.code}</span>
                              <span className="text-gray-500">{curr.symbol}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
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

            {/* User Dropdown — NOW SHOWS LIVE PROFILE PIC */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-3 rounded-full hover:bg-gray-100 px-3 py-2 transition"
                >
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt="Profile"
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#118C8C] flex items-center justify-center text-white font-bold text-lg">
                      {user.email[0].toUpperCase()}
                    </div>
                  )}
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
                      <Link
                        to="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-5 py-3 text-gray-700 hover:bg-gray-50 transition"
                      >
                        <User size={18} />
                        Profile
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

          {/* Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden flex items-center gap-4 text-[#118C8C] ml-auto"
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
                  className={`bg-transparent hover:bg-transparent block py-3 px-4 rounded-lg text-lg font-medium transition ${
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
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-[#118C8C] font-medium hover:bg-gray-50"
                  >
                    Profile
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
