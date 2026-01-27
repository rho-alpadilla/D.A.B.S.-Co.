// src/App.jsx ← UPDATED: ADDED PROTECTED /CHECKOUT ROUTE
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// Providers
import { AuthProvider, useAuth } from '@/lib/firebase';
import { CartProvider } from '@/context/CartContext';

// Layout
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';

// Pages
import HomePage from '@/pages/HomePage';
import GalleryPage from '@/pages/GalleryPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import PricelistsPage from '@/pages/PricelistsPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage'; // ← NEW IMPORT
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsPage from '@/pages/TermsPage';
import FAQsPage from '@/pages/FAQsPage';

import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import BuyerDashboard from '@/pages/BuyerDashboard';
import ProfilePage from '@/pages/ProfilePage';
import AdminPanel from '@/pages/AdminPanel';

// Protected Route for logged-in users (reusable for buyer pages like checkout)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Protected Admin Route (unchanged)
const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          {/* 🌊 GLOBAL BACKGROUND WRAPPER */}
          <div
            className="min-h-screen flex flex-col"
            style={{
              backgroundColor: "#FAF8F1",
              backgroundImage: `
                radial-gradient(circle at 20% 20%, rgba(17,140,140,0.35), transparent 45%),
                radial-gradient(circle at 80% 30%, rgba(242,187,22,0.30), transparent 45%),
                radial-gradient(circle at 40% 80%, rgba(17,140,140,0.25), transparent 50%),
                linear-gradient(
                  180deg,
                  #dff1ef 0%,
                  #eaf6f3 30%,
                  #f6f2dc 60%,
                  #faf8f1 100%
                )
              `,
              backgroundAttachment: "fixed",
              backgroundRepeat: "no-repeat",
            }}
          >
            <Header />

            <main className="flex-grow">
              <Routes>
                {/* PUBLIC */}
                <Route path="/" element={<HomePage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/pricelists" element={<PricelistsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/faqs" element={<FAQsPage />} />

                {/* AUTH */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* CHECKOUT - PROTECTED */}
                <Route 
                  path="/checkout" 
                  element={
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  } 
                />

                {/* ADMIN */}
                <Route
                  path="/admin-panel"
                  element={
                    <ProtectedAdminRoute>
                      <AdminPanel />
                    </ProtectedAdminRoute>
                  }
                />

                {/* Redirects */}
                <Route path="/admin" element={<Navigate to="/admin-panel" />} />
                <Route path="*" element={<HomePage />} />
              </Routes>
            </main>

            <Footer />
            <ChatWidget />
            <Toaster />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;