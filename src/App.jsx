import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useAuth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

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
import MessageCenterPage from '@/pages/MessageCenterPage';

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
        <div className="w-16 h-16 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin"></div>
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
          <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />

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