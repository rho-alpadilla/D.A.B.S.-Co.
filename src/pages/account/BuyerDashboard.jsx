// src/pages/BuyerDashboard.jsx ← UPDATED: SUMMARY CARDS + QUICK ACTIONS (NO ORDER TABLE)
import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc
} from 'firebase/firestore';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import {
  ShoppingBag,
  Package,
  LogOut,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User as UserIcon,
  MapPin,
  MessageCircle
} from 'lucide-react';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, cartCount } = useCart();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [username, setUsername] = useState("");

  // Fetch username
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

  // Load orders (for counts only)
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "orders"),
      where("buyerEmail", "==", user.email),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingOrders(false);
    });

    return () => unsub();
  }, [user]);

  const handleLogout = () => signOut(auth).then(() => navigate('/login'));

  // ---- ORDER COUNTS (same logic as your previous dashboard)
  const pendingCount = useMemo(() => {
    return orders.filter(o =>
      ["pending", "Paid / Processing", "processing", "Cancellation Requested"].includes(o.status)
    ).length;
  }, [orders]);

  const completedCount = useMemo(() => {
    return orders.filter(o => o.status === "completed").length;
  }, [orders]);

  const cancelledCount = useMemo(() => {
    return orders.filter(o =>
      ["cancelled", "Cancelled – Pending Refund", "Refunded"].includes(o.status)
    ).length;
  }, [orders]);

  const allCount = orders.length;

  // ---- CART SUBTOTAL (optional nice touch)
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  if (authLoading || loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#118C8C] border-t-transparent rounded-full animate-spin"></div>
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

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Greeting */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome back, <span className="text-[#118C8C]">@{username}</span>!
            </h1>
            <p className="text-gray-600 mt-2">
              Quick snapshot of your cart and orders
            </p>
          </div>

          {/* ✅ ORDER SUMMARY CARDS */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Package className="text-[#F2BB16]" size={32} />
                Order Summary
              </h2>

              {/* Goes to your orders page (currently /pending-orders but titled My Orders) */}
              <Button asChild className="bg-[#118C8C] hover:bg-[#0d7070]">
                <Link to="/pending-orders">
                  View My Orders <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <SummaryCard
                title="Pending"
                value={pendingCount}
                icon={<Clock size={22} className="text-yellow-600" />}
                bg="bg-yellow-50"
                to="/pending-orders"
                subtitle="To be processed"
              />
              <SummaryCard
                title="Completed"
                value={completedCount}
                icon={<CheckCircle size={22} className="text-green-600" />}
                bg="bg-green-50"
                to="/pending-orders"
                subtitle="Delivered / done"
              />
              <SummaryCard
                title="Cancelled"
                value={cancelledCount}
                icon={<XCircle size={22} className="text-gray-600" />}
                bg="bg-gray-100"
                to="/pending-orders"
                subtitle="Cancelled orders"
              />
              <SummaryCard
                title="Total Orders"
                value={allCount}
                icon={<AlertCircle size={22} className="text-blue-600" />}
                bg="bg-blue-50"
                to="/pending-orders"
                subtitle="All time"
              />
            </div>
          </div>

          {/* ✅ MY CART PREVIEW */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <ShoppingBag className="text-[#118C8C]" size={32} />
                My Cart ({cartCount} items)
              </h2>

              <div className="flex items-center gap-3">
                <Button asChild className="bg-[#118C8C] hover:bg-[#0d7070]">
                  <Link to="/cart">Go to Cart <ArrowRight size={18} className="ml-2" /></Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/gallery">Continue Shopping</Link>
                </Button>
              </div>
            </div>

            {cartItems.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                <ShoppingBag size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <Button asChild size="lg" className="mt-6 bg-[#118C8C] hover:bg-[#0d7070]">
                  <Link to="/gallery">Start Shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {cartItems.slice(0, 3).map(item => (
                  <div key={item.id} className="p-6 border-b last:border-0 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">x{item.quantity}</p>
                    </div>
                    <p className="font-bold text-[#118C8C]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}

                <div className="p-5 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-gray-700">
                    Subtotal: <span className="font-bold">{formatPrice(cartSubtotal)}</span>
                  </p>

                  {cartItems.length > 3 ? (
                    <Link to="/cart" className="text-[#118C8C] hover:underline text-sm font-medium">
                      + {cartItems.length - 3} more items
                    </Link>
                  ) : (
                    <span className="text-xs text-gray-500">Ready to checkout anytime.</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ✅ QUICK ACTIONS */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <UserIcon className="text-[#118C8C]" size={32} />
              Quick Actions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <ActionCard
                title="View My Orders"
                desc="Track status, request cancellation, view history."
                icon={<Package size={22} className="text-[#118C8C]" />}
                to="/pending-orders"
              />
              <ActionCard
                title="Edit Profile"
                desc="Update your name, username, and info."
                icon={<UserIcon size={22} className="text-[#118C8C]" />}
                to="/profile"
              />
              <ActionCard
                title="Manage Addresses"
                desc="Update your delivery address details."
                icon={<MapPin size={22} className="text-[#118C8C]" />}
                to="/profile"
              />
              <ActionCard
                title="Go to Cart"
                desc="Review items and proceed to checkout."
                icon={<ShoppingBag size={22} className="text-[#118C8C]" />}
                to="/cart"
              />
              <ActionCard
                title="Browse Products"
                desc="Explore handmade products and new arrivals."
                icon={<ArrowRight size={22} className="text-[#118C8C]" />}
                to="/gallery"
              />
              <ActionCard
                title="Contact Support"
                desc="Need help? Use chat or contact page."
                icon={<MessageCircle size={22} className="text-[#118C8C]" />}
                to="/contact"
              />
            </div>
          </div>

          {/* Logout */}
          <div className="text-center mt-12">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              <LogOut className="mr-2" size={20} /> Log Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

const SummaryCard = ({ title, value, icon, bg, to, subtitle }) => {
  return (
    <Link
      to={to}
      className={`rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition ${bg} block`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-4xl font-extrabold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </div>

      <div className="mt-4 text-sm font-semibold text-[#118C8C] flex items-center gap-2">
        View details <ArrowRight size={16} />
      </div>
    </Link>
  );
};

const ActionCard = ({ title, desc, icon, to }) => {
  return (
    <Link
      to={to}
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition block"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#e7f6f6] flex items-center justify-center">
          {icon}
        </div>
        <p className="font-bold text-gray-900">{title}</p>
      </div>
      <p className="text-sm text-gray-600">{desc}</p>
      <div className="mt-4 text-sm font-semibold text-[#118C8C] flex items-center gap-2">
        Go <ArrowRight size={16} />
      </div>
    </Link>
  );
};

export default BuyerDashboard;
