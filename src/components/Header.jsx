import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/pricelists', label: 'Pricing' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' }
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/');
  };

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
                  isActive(link.path)
                    ? 'text-[#118C8C]'
                    : 'text-gray-700 hover:text-[#118C8C]'
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

            {/* Action Icons */}
            <div className="flex items-center gap-4 ml-4 border-l pl-6 border-gray-200">
              <Link to="/cart" className="relative text-gray-700 hover:text-[#118C8C]">
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#F2BB16] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center gap-4">
                  <Link to={user.role === 'admin' ? '/admin-panel' : '/buyer-dashboard'}>
                    <Button variant="ghost" className="text-[#118C8C] font-medium hover:bg-[#e0f2f2] flex items-center gap-2">
                      <User size={18} />
                      <span className="hidden lg:inline">{user.name}</span>
                    </Button>
                  </Link>
                  <Button 
                    onClick={handleLogout}
                    className="bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm px-4 h-9"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-700 hover:text-[#118C8C]">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 h-9">
                      Join
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-[#118C8C] hover:text-[#0d7070] transition-colors flex items-center gap-4"
            aria-label="Toggle menu"
          >
             <Link to="/cart" className="relative text-gray-700 mr-2" onClick={(e) => e.stopPropagation()}>
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#F2BB16] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden mt-4 space-y-3 overflow-hidden bg-white pb-4"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block py-2 px-4 rounded-lg transition-colors ${
                    isActive(link.path)
                      ? 'bg-[#118C8C] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-gray-200 pt-3 mt-3 space-y-3">
                {user ? (
                  <>
                    <Link
                      to={user.role === 'admin' ? '/admin-panel' : '/buyer-dashboard'}
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-2 px-4 rounded-lg text-[#118C8C] font-medium hover:bg-gray-100 flex items-center gap-2"
                    >
                      <User size={18} />
                      Dashboard ({user.name})
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left py-2 px-4 rounded-lg text-red-500 font-medium hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-2 px-4 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-2 px-4 rounded-lg bg-[#F2BB16] text-gray-900 font-bold text-center"
                    >
                      Register Now
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;