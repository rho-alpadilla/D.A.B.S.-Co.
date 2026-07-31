import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// Layout & Shared Components
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatWidget from '@/components/shared/ChatWidget';
import CustomOrderDrawer from '@/components/shared/CustomOrderDrawer';

// Marketing Pages
import HomePage from '@/pages/marketing/HomePage';
import HighlightsPage from '@/pages/marketing/HighlightsPage';
import GalleryPage from '@/pages/marketing/GalleryPage';
import AboutPage from '@/pages/marketing/AboutPage';
import ContactPage from '@/pages/marketing/ContactPage';
import FAQsPage from '@/pages/marketing/FAQsPage';
import PrivacyPolicyPage from '@/pages/marketing/PrivacyPolicyPage';
import TermsPage from '@/pages/marketing/TermsPage';

// Shop Pages
import ProductDetailPage from '@/pages/shop/ProductDetailPage';
import PricelistsPage from '@/pages/shop/PricelistsPage';
import CartPage from '@/pages/shop/CartPage';
import CheckoutPage from '@/pages/shop/CheckoutPage';

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Account Pages
import BuyerDashboard from '@/pages/account/BuyerDashboard';
import ProfilePage from '@/pages/account/ProfilePage';
import PendingOrdersPage from '@/pages/account/PendingOrdersPage';
import MessageCenterPage from '@/pages/account/MessageCenterPage';

// Admin Pages
import AdminPanel from '@/pages/admin/AdminPanel';
import AddProductPage from '@/pages/admin/AddProductPage';

const ScrollToHash = () => {
  const location = useLocation();

  // stop browser from restoring the previous scroll position on refresh/back
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const hash = location.hash.replace('#', '');

    // if there is a hash, scroll to that section
    if (hash) {
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
      return;
    }

    // no hash = normal page navigation, always go to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }, [location.pathname, location.hash]);

  return null;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-artisan-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const ProtectedAdminRoute = ({ children, allowSubAdmin = false }) => {
  const { user, loading } = useAuth();
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          setRole(snap.data()?.role || null);
        } else {
          setRole(null);
        }
        setRoleLoading(false);
      },
      () => {
        setRole(null);
        setRoleLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowSubAdmin) {
    if (role !== 'admin' && role !== 'sub-admin') {
      return <Navigate to="/" replace />;
    }
  } else {
    if (role !== 'admin') {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

const RoleBasedHome = () => {
  const { user, loading } = useAuth();
  const [role, setRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          setRole(snap.data()?.role || null);
        } else {
          setRole(null);
        }
        setRoleLoading(false);
      },
      () => {
        setRole(null);
        setRoleLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (role === 'admin' || role === 'sub-admin') {
    return <AdminPanel />;
  }

  return <HomePage />;
};

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col artisan-page-bg">
      <ScrollToHash />
      <Header />

      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <main id="main-content" className="flex-grow" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<RoleBasedHome />} />
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

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/buyer-dashboard"
            element={
              <ProtectedRoute>
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

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

          <Route
            path="/admin-panel"
            element={
              <ProtectedAdminRoute allowSubAdmin={true}>
                <AdminPanel />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/add-product"
            element={
              <ProtectedAdminRoute allowSubAdmin={true}>
                <AddProductPage />
              </ProtectedAdminRoute>
            }
          />

<Route
  path="/message-center"
  element={
    <ProtectedRoute>
      <MessageCenterPage />
    </ProtectedRoute>
  }
/>

          <Route path="/admin" element={<Navigate to="/admin-panel" replace />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <Footer />
      <ChatWidget />
      <CustomOrderDrawer />
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
