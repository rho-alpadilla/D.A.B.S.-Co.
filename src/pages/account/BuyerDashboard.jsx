// src/pages/account/BuyerDashboard.jsx
// Design A — Artisan Canvas reskin. ALL Firebase onSnapshot listeners, order counts,
// cart preview, quick actions, and logout are fully preserved.
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag, Package, LogOut, ArrowRight, Clock, CheckCircle,
  AlertCircle, XCircle, User as UserIcon, MapPin, MessageCircle, Sparkles,
} from 'lucide-react';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, cartCount } = useCart();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [username, setUsername] = useState('');

  // Fetch username from Firestore
  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUsername(docSnap.data().username || user.email.split('@')[0]);
      }
    });
    return () => unsub();
  }, [user]);

  // Load all orders for this buyer (counts only — no table rendered)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'orders'),
      where('buyerEmail', '==', user.email),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingOrders(false);
    });
    return () => unsub();
  }, [user]);

  const handleLogout = () => signOut(auth).then(() => navigate('/login'));

  const pendingCount = useMemo(
    () => orders.filter((o) => ['pending', 'Paid / Processing', 'processing', 'Cancellation Requested'].includes(o.status)).length,
    [orders]
  );
  const completedCount = useMemo(() => orders.filter((o) => o.status === 'completed').length, [orders]);
  const cancelledCount = useMemo(() => orders.filter((o) => ['cancelled', 'Cancelled – Pending Refund', 'Refunded'].includes(o.status)).length, [orders]);
  const allCount = orders.length;

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  if (authLoading || loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--artisan-gradient-bg)' }}>
        <div className="w-16 h-16 border-4 border-artisan-primary-pale border-t-artisan-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <>
      <Helmet><title>My Account - D.A.B.S. Co.</title></Helmet>

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#5C2D91" color2="#7B3FA0" color3="#C9A0DC"
            timeSpeed={0.25} colorBalance={-0.06} warpStrength={1.5}
            warpFrequency={3.8} warpSpeed={2} warpAmplitude={50}
            blendAngle={0} blendSoftness={1} rotationAmount={500}
            noiseScale={2} grainAmount={0.1} grainScale={2}
            grainAnimated={false} contrast={1.5} gamma={1}
            saturation={1} centerX={0} centerY={0} zoom={0.9}
          />
          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={180} particleSpread={10} speed={0.1}
              particleColors={['#FAF8FF', '#E8D8F3', '#C9A0DC']}
              moveParticlesOnHover particleHoverFactor={1}
              alphaParticles={false} particleBaseSize={120}
              sizeRandomness={1.4} cameraDistance={53} disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10 container mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">

          {/* ── Greeting ── */}
          <div className="relative mb-10 overflow-hidden rounded-[2rem] border border-white/45 bg-white/95 p-7 text-center shadow-xl shadow-[#2D0E5A]/20 backdrop-blur-md md:p-10 md:text-left">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, #C9A0DC, transparent)' }} />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-artisan-primary/20 bg-artisan-primary-wash px-4 py-1.5 text-sm font-medium text-artisan-primary mb-4">
                <Sparkles size={14} />
                My Account
              </div>
              <h1 className="font-artisan-display text-4xl font-bold text-[#2A1739] md:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Welcome back, <span className="text-artisan-primary">@{username}</span>!
              </h1>
              <p className="text-artisan-text-muted mt-2">Quick snapshot of your cart and orders.</p>
            </div>
          </div>

          {/* ── Order Summary Cards ── */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                <Package className="text-amber-300" size={28} />
                Order Summary
              </h2>
              <Button asChild>
                <Link to="/pending-orders">
                  View My Orders <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard title="Pending" value={pendingCount} icon={<Clock size={22} className="text-amber-600" />} bg="bg-amber-50" to="/pending-orders" subtitle="To be processed" accentColor="#5C2D91" />
              <SummaryCard title="Completed" value={completedCount} icon={<CheckCircle size={22} className="text-green-600" />} bg="bg-green-50" to="/pending-orders" subtitle="Delivered / done" accentColor="#5C2D91" />
              <SummaryCard title="Cancelled" value={cancelledCount} icon={<XCircle size={22} className="text-gray-500" />} bg="bg-gray-100" to="/pending-orders" subtitle="Cancelled orders" accentColor="#5C2D91" />
              <SummaryCard title="Total Orders" value={allCount} icon={<AlertCircle size={22} className="text-artisan-primary" />} bg="bg-artisan-primary-wash" to="/pending-orders" subtitle="All time" accentColor="#5C2D91" />
            </div>
          </div>

          {/* ── Cart Preview ── */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                <ShoppingBag className="text-artisan-primary-pale" size={28} />
                My Cart ({cartCount} items)
              </h2>
              <div className="flex items-center gap-3">
                <Button asChild>
                  <Link to="/cart">Go to Cart <ArrowRight size={18} className="ml-2" /></Link>
                </Button>
                <Button asChild variant="outline" className="border-2 border-white/40 bg-white/10 text-white hover:bg-white/20">
                  <Link to="/gallery">Continue Shopping</Link>
                </Button>
              </div>
            </div>

            {cartItems.length === 0 ? (
              <div className="rounded-[2rem] border border-white/45 bg-white/95 p-12 text-center shadow-xl shadow-[#2D0E5A]/15 backdrop-blur-md">
                <ShoppingBag size={64} className="mx-auto text-artisan-primary-pale mb-4" />
                <p className="text-artisan-text-muted text-lg">Your cart is empty</p>
                <Button asChild size="lg" className="mt-6">
                  <Link to="/gallery">Start Shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[2rem] border border-white/45 bg-white/95 shadow-xl shadow-[#2D0E5A]/15 backdrop-blur-md">
                {cartItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-6 border-b last:border-0 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-artisan-text">{item.name}</p>
                      <p className="text-sm text-artisan-text-muted">×{item.quantity}</p>
                    </div>
                    <p className="font-bold text-artisan-primary">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
                <div className="p-5 bg-artisan-primary-wash/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-artisan-text-mid">
                    Subtotal: <span className="font-bold text-artisan-primary">{formatPrice(cartSubtotal)}</span>
                  </p>
                  {cartItems.length > 3 ? (
                    <Link to="/cart" className="text-artisan-primary hover:underline text-sm font-medium">
                      + {cartItems.length - 3} more items
                    </Link>
                  ) : (
                    <span className="text-xs text-artisan-text-faint">Ready to checkout anytime.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Quick Actions ── */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              <UserIcon className="text-artisan-primary-pale" size={28} />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ActionCard title="View My Orders" desc="Track status, request cancellation, view history." icon={<Package size={22} className="text-artisan-primary" />} to="/pending-orders" />
              <ActionCard title="Edit Profile" desc="Update your name, username, and info." icon={<UserIcon size={22} className="text-artisan-primary" />} to="/profile" />
              <ActionCard title="Manage Addresses" desc="Update your delivery address details." icon={<MapPin size={22} className="text-artisan-primary" />} to="/profile" />
              <ActionCard title="Go to Cart" desc="Review items and proceed to checkout." icon={<ShoppingBag size={22} className="text-artisan-primary" />} to="/cart" />
              <ActionCard title="Browse Products" desc="Explore handmade products and new arrivals." icon={<ArrowRight size={22} className="text-artisan-primary" />} to="/gallery" />
              <ActionCard title="Contact Support" desc="Need help? Use chat or contact page." icon={<MessageCircle size={22} className="text-artisan-primary" />} to="/contact" />
            </div>
          </div>

          {/* Logout */}
          <div className="text-center mt-8">
            <Button variant="outline" onClick={handleLogout} className="border-2 border-red-300 text-red-500 hover:bg-red-50">
              <LogOut className="mr-2" size={20} /> Log Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

const SummaryCard = ({ title, value, icon, bg, to, subtitle, accentColor }) => (
  <Link to={to} className={`block rounded-2xl border border-white/60 p-6 shadow-lg shadow-[#2D0E5A]/10 transition hover:-translate-y-1 hover:shadow-xl ${bg} artisan-card-hover`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-artisan-text-mid font-medium">{title}</p>
        <p className="text-4xl font-extrabold text-artisan-text mt-1">{value}</p>
        <p className="text-xs text-artisan-text-faint mt-2">{subtitle}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 shadow-sm">
        {icon}
      </div>
    </div>
    <div className="mt-4 text-sm font-semibold flex items-center gap-2" style={{ color: accentColor }}>
      View details <ArrowRight size={16} />
    </div>
  </Link>
);

const ActionCard = ({ title, desc, icon, to }) => (
  <Link to={to} className="block rounded-2xl border border-white/45 bg-white/95 p-6 shadow-lg shadow-[#2D0E5A]/10 backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl artisan-card-hover">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl bg-artisan-primary-wash flex items-center justify-center">
        {icon}
      </div>
      <p className="font-bold text-[#2A1739]">{title}</p>
    </div>
    <p className="text-sm leading-6 text-[#5B4C66]">{desc}</p>
    <div className="mt-4 text-sm font-semibold text-artisan-primary flex items-center gap-2">
      Go <ArrowRight size={16} />
    </div>
  </Link>
);

export default BuyerDashboard;
