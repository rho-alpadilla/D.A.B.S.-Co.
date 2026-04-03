import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/lib/firebase';

// Layout
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChatWidget from '@/components/ChatWidget';

// Pages
import HomePage from '@/pages/HomePage';
import HighlightsPage from '@/pages/HighlightsPage';
import GalleryPage from '@/pages/GalleryPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import PricelistsPage from '@/pages/PricelistsPage';
import AddProductPage from '@/pages/AddProductPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';
import TermsPage from '@/pages/TermsPage';
import FAQsPage from '@/pages/FAQsPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import BuyerDashboard from '@/pages/BuyerDashboard';
import ProfilePage from '@/pages/ProfilePage';
import AdminPanel from '@/pages/AdminPanel';
import PendingOrdersPage from '@/pages/PendingOrdersPage';

const ScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (!hash) return;

    const scrollToElement = (attempt = 0) => {
      const el = document.getElementById(hash);

      if (el) {
        const headerOffset = 110;
        const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
        const targetTop = Math.max(elementTop - headerOffset, 0);

        window.scrollTo({
          top: targetTop,
          behavior: 'smooth',
        });
        return;
      }

      if (attempt < 15) {
        setTimeout(() => scrollToElement(attempt + 1), 120);
      }
    };

    setTimeout(() => scrollToElement(), 100);
  }, [location.pathname, location.hash]);

  return null;
};

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

function AppContent() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: '#FAF8F1',
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
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <ScrollToHash />
      <Header />

      <main className="flex-grow">
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<HomePage />} />
          <Route path="/highlights" element={<HighlightsPage />} />
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

          {/* BUYER PROTECTED */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pending-orders"
            element={
              <ProtectedRoute>
                <PendingOrdersPage />
              </ProtectedRoute>
            }
          />

          {/* ADMIN PROTECTED */}
          <Route
            path="/admin-panel"
            element={
              <ProtectedAdminRoute>
                <AdminPanel />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/add-product"
            element={
              <ProtectedAdminRoute>
                <AddProductPage />
              </ProtectedAdminRoute>
            }
          />

          {/* Redirects */}
          <Route path="/admin" element={<Navigate to="/admin-panel" replace />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <Footer />
      <ChatWidget />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;