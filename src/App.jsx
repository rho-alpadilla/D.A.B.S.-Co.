// src/pages/App.jsx  (or wherever your App.jsx lives)
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

// Providers – we keep your existing context + add Firebase Auth
import { AuthProvider } from '@/lib/firebase';        // ← NEW: Firebase Auth
import { CartProvider } from '@/context/CartContext';
import { StoreProvider } from '@/context/StoreContext';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';
import AuthModal from '@/components/AuthModal';          // ← NEW: Login/Register modal

// Pages
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
import BuyerDashboard from '@/pages/BuyerDashboard';
import AdminPanel from '@/pages/AdminPanel';

// You can keep these pages or delete them later – they won’t break anything
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';

function App() {
  return (
    <AuthProvider>                     {/* ← Firebase Auth wrapper */}
      <StoreProvider>
        <CartProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-[#FAF8F1]">
              <Header />
              
              <main className="flex-grow">
                <Routes>
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

                  {/* Auth-related pages – you can keep or remove later */}
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
                  <Route path="/admin-panel" element={<AdminPanel />} />
                </Routes>
              </main>

              <Footer />
              <ChatWidget />
              <AuthModal />        {/* ← This shows the login/register modal + logged-in profile */}
              <Toaster />
            </div>
          </Router>
        </CartProvider>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;