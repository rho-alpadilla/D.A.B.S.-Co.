// src/App.jsx ← FINAL VERSION: HOMEPAGE FIRST, NO POPUP, CLEAN ROUTES
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// Providers (Firebase Auth, Cart, Store)
import { AuthProvider, useAuth } from '@/lib/firebase';
import { CartProvider } from '@/context/CartContext';
import { StoreProvider } from '@/context/StoreContext';

// Layout Components
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';

// Pages (All Public)
import HomePage from '@/pages/HomePage';
import GalleryPage from '@/pages/GalleryPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import PricelistsPage from '@/pages/PricelistsPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import CartPage from '@/pages/CartPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsPage from '@/pages/TermsPage';
import FAQsPage from '@/pages/FAQsPage';

// Auth Pages
import LoginPage from '@/pages/LoginPage';           // ← We use this now
import RegisterPage from '@/pages/RegisterPage';
import BuyerDashboard from '@/pages/BuyerDashboard';

// Admin (Protected)
import AdminPanel from '@/pages/AdminPanel';

// Protected Route — Only logged-in admins can access
const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // While checking login status → show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F1]">
        <div className="w-16 h-16 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not logged in → go to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Optional: Extra check if user is actually admin (from Firestore)
  // You already do this inside AdminPanel, so it's safe
  return children;
};

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-[#FAF8F1]">
              {/* HEADER — Always visible on all pages */}
              <Header />

              {/* MAIN CONTENT */}
              <main className="flex-grow">
                <Routes>
                  {/* PUBLIC ROUTES — These show immediately when user opens site */}
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

                  {/* AUTH PAGES */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/buyer-dashboard" element={<BuyerDashboard />} />

                  {/* ADMIN PANEL — FULLY PROTECTED */}
                  <Route
                    path="/admin-panel"
                    element={
                      <ProtectedAdminRoute>
                        <AdminPanel />
                      </ProtectedAdminRoute>
                    }
                  />

                  {/* Redirect old links */}
                  <Route path="/admin" element={<Navigate to="/admin-panel" />} />

                  {/* 404 → Go home */}
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </main>

              <Footer />
              <ChatWidget />
              <Toaster />
            </div>
          </Router>
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;