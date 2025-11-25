import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Instagram, Facebook } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="bg-white border-t border-gray-200 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Essential Links */}
          <div>
            <span className="text-lg font-semibold text-[#118C8C] mb-4 block">Essential Links</span>
            <div className="space-y-2">
              <Link to="/" className="block text-gray-700 hover:text-[#118C8C] transition-colors">
                Home
              </Link>
              <Link to="/gallery" className="block text-gray-700 hover:text-[#118C8C] transition-colors">
                Gallery
              </Link>
              <Link to="/about" className="block text-gray-700 hover:text-[#118C8C] transition-colors">
                About
              </Link>
              <Link to="/pricelists" className="block text-gray-700 hover:text-[#118C8C] transition-colors">
                Pricing
              </Link>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <span className="text-lg font-semibold text-[#118C8C] mb-4 block">Contact Information</span>
            <div className="space-y-3">
              <a href="mailto:contact@dabsco.com" className="flex items-center gap-2 text-gray-700 hover:text-[#118C8C] transition-colors">
                <Mail size={18} />
                <span>contact@dabsco.com</span>
              </a>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin size={18} />
                <span>123 Artisan Street, Creative City</span>
              </div>
              <div className="flex gap-4 mt-4">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-[#118C8C] transition-colors">
                  <Instagram size={24} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-[#118C8C] transition-colors">
                  <Facebook size={24} />
                </a>
              </div>
            </div>
          </div>

          {/* Utility Links */}
          <div>
            <span className="text-lg font-semibold text-[#118C8C] mb-4 block">Utility Links</span>
            <div className="space-y-2">
              {!user && (
                <>
                  <Link to="/login" className="block text-gray-700 hover:text-[#118C8C] transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="block text-gray-700 hover:text-[#118C8C] transition-colors">
                    Register
                  </Link>
                </>
              )}
              {user && (
                 <Link to={user.role === 'admin' ? '/admin-panel' : '/buyer-dashboard'} className="block text-gray-700 hover:text-[#118C8C] transition-colors">
                   My Dashboard
                 </Link>
              )}
              <Link to="/privacy-policy" className="block text-gray-700 hover:text-[#118C8C] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="block text-gray-700 hover:text-[#118C8C] transition-colors">
                Terms of Service
              </Link>
              <Link to="/faqs" className="block text-gray-700 hover:text-[#118C8C] transition-colors">
                FAQs
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} D.A.B.S. Co. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;