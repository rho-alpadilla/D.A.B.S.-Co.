// src/components/Footer.jsx
// Removed login / logout / register section from footer
// Kept the original structure, colors, and layout
// Added only simple comments on important sections

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';

const Footer = () => {
  const { loading } = useAuth();

  // Loading state for smoother footer rendering
  if (loading) {
    return (
      <footer className="bg-[#118C8C] text-white py-12 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="h-6 bg-white/20 rounded w-48 mx-auto animate-pulse" />
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-[#118C8C] text-white py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left min-w-0">
          {/* Brand */}
          <div className="min-w-[180px]">
            <h3 className="text-2xl font-bold mb-2">D.A.B.S. Co.</h3>
            <p className="text-sm opacity-90">Handcrafted with love</p>
          </div>

          {/* Quick links */}
          <div className="min-w-[180px]">
            <h4 className="font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:underline">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/pricelists" className="hover:underline">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:underline">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support links */}
          <div className="min-w-[180px]">
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faqs" className="hover:underline">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:underline">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="text-center mt-10 pt-8 border-t border-white/20 text-sm">
          © {new Date().getFullYear()} D.A.B.S. Co. • All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;