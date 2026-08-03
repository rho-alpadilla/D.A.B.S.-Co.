import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  ShoppingBag,
  UserRound,
  XCircle,
} from 'lucide-react';
import { auth, db, useAuth } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';

const ACTIVE_ORDER_STATUSES = ['pending', 'Paid / Processing', 'processing', 'Cancellation Requested'];
const CANCELLED_ORDER_STATUSES = ['cancelled', 'Cancelled – Pending Refund', 'Refunded'];

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { cartItems, cartCount } = useCart();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (!user) {
      setUsername('');
      return undefined;
    }

    const fallbackUsername = user.email?.split('@')[0] || 'there';
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snapshot) => {
      setUsername(snapshot.exists() ? snapshot.data().username || fallbackUsername : fallbackUsername);
    });

    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoadingOrders(false);
      return undefined;
    }

    setLoadingOrders(true);
    const ordersQuery = query(
      collection(db, 'orders'),
      where('buyerEmail', '==', user.email),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map((order) => ({ id: order.id, ...order.data() })));
      setLoadingOrders(false);
    });

    return unsubscribe;
  }, [user]);

  const orderSummary = useMemo(() => ({
    active: orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)).length,
    completed: orders.filter((order) => order.status === 'completed').length,
    cancelled: orders.filter((order) => CANCELLED_ORDER_STATUSES.includes(order.status)).length,
    total: orders.length,
  }), [orders]);

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const handleLogout = () => signOut(auth).then(() => navigate('/login'));

  if (authLoading || loadingOrders) {
    return <DashboardLoadingState />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Helmet><title>My Account - D.A.B.S. Co.</title></Helmet>

      <main className="artisan-grid-page min-h-screen px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <DashboardHeader username={username} cartCount={cartCount} />

          <section className="mt-8 grid gap-6 lg:grid-cols-3">
            <OrderOverview summary={orderSummary} />
            <CartOverview cartItems={cartItems} cartCount={cartCount} cartSubtotal={cartSubtotal} formatPrice={formatPrice} />
          </section>

          <section className="mt-10 border-t border-[#5C2D91]/20 pt-8">
            <h2 className="font-artisan-display text-3xl font-semibold tracking-tight text-artisan-text">Account</h2>

            <div className="mt-6 grid overflow-hidden rounded-3xl border border-[#5C2D91]/20 bg-[#FAF8F1] sm:grid-cols-2 lg:grid-cols-3">
              <DashboardAction title="My orders" icon={Package} to="/pending-orders" />
              <DashboardAction title="Edit profile" icon={UserRound} to="/profile" />
              <DashboardAction title="Addresses" icon={MapPin} to="/profile" />
              <DashboardAction title="Gallery" icon={ShoppingBag} to="/gallery" />
              <DashboardAction title="Contact support" icon={MessageCircle} to="/contact" />
              <DashboardAction title="Cart" icon={ArrowRight} to="/cart" />
            </div>
          </section>

          <div className="mt-10 border-t border-[#5C2D91]/20 pt-6">
            <Button variant="outline" onClick={handleLogout} className="border-[#5C2D91]/30 bg-[#FAF8F1] text-artisan-text hover:border-red-300 hover:bg-red-50 hover:text-red-700">
              <LogOut className="mr-2" size={18} />
              Log out
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

const DashboardLoadingState = () => (
  <div className="artisan-grid-page flex min-h-screen items-center justify-center px-6">
    <div className="flex items-center gap-3 rounded-full border border-[#5C2D91]/20 bg-[#FAF8F1] px-5 py-3 text-sm font-medium text-artisan-text shadow-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-artisan-primary/25 border-t-artisan-primary" aria-hidden="true" />
      Loading your account
    </div>
  </div>
);

const DashboardHeader = ({ username, cartCount }) => (
  <header className="border-b border-[#5C2D91]/25 pb-8 sm:flex sm:items-end sm:justify-between">
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-artisan-primary">Account</p>
      <h1 className="mt-3 font-artisan-display text-4xl font-semibold tracking-[-0.04em] text-artisan-text sm:text-5xl">
        Welcome back, {username}.
      </h1>
    </div>
    <Link
      to="/cart"
      className="artisan-card-hover mt-6 inline-flex w-fit items-center gap-3 rounded-full border border-[#5C2D91]/25 bg-[#FAF8F1] px-4 py-2.5 text-sm font-semibold text-artisan-text sm:mt-0"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-artisan-primary text-white"><ShoppingBag size={16} /></span>
      Cart <span className="text-artisan-primary">{cartCount}</span>
    </Link>
  </header>
);

const OrderOverview = ({ summary }) => (
  <section aria-labelledby="order-overview-heading" className="border-y border-[#5C2D91]/20 py-6 sm:py-7 lg:col-span-2">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-artisan-primary">Orders</p>
        <h2 id="order-overview-heading" className="mt-2 font-artisan-display text-3xl font-semibold tracking-tight text-artisan-text">Order activity</h2>
      </div>
      <Button asChild variant="outline" className="w-full border-[#5C2D91]/25 bg-transparent text-artisan-primary hover:bg-artisan-primary-wash sm:w-auto">
        <Link to="/pending-orders">View all <ArrowRight className="ml-2" size={16} /></Link>
      </Button>
    </div>

    <div className="mt-7 grid grid-cols-2 divide-x divide-y divide-[#5C2D91]/15 overflow-hidden rounded-2xl border border-[#5C2D91]/15 lg:grid-cols-4 lg:divide-y-0">
      <OrderMetric label="In progress" value={summary.active} icon={Clock3} iconClass="text-amber-700" />
      <OrderMetric label="Completed" value={summary.completed} icon={CheckCircle2} iconClass="text-emerald-700" />
      <OrderMetric label="Cancelled" value={summary.cancelled} icon={XCircle} iconClass="text-artisan-text-muted" />
      <OrderMetric label="All orders" value={summary.total} icon={Package} iconClass="text-artisan-primary" />
    </div>
  </section>
);

const OrderMetric = ({ label, value, icon: Icon, iconClass }) => (
  <Link to="/pending-orders" className="group min-w-0 bg-white/55 p-4 transition-colors duration-200 ease-out hover:bg-artisan-primary-wash/70 sm:p-5">
    <Icon size={19} className={iconClass} aria-hidden="true" />
    <p className="mt-7 text-3xl font-semibold tracking-tight text-artisan-text">{value}</p>
    <p className="mt-1 text-sm font-medium text-artisan-text-muted">{label}</p>
  </Link>
);

const CartOverview = ({ cartItems, cartCount, cartSubtotal, formatPrice }) => (
  <aside aria-labelledby="cart-overview-heading" className="rounded-3xl bg-[#2D0E5A] p-5 text-[#FAF8F1] shadow-[0_18px_45px_rgba(45,14,90,0.2)] sm:p-7">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C9A0DC]">Cart</p>
        <h2 id="cart-overview-heading" className="mt-2 font-artisan-display text-3xl font-semibold tracking-tight">Your cart</h2>
      </div>
      <span className="flex h-10 min-w-10 items-center justify-center rounded-full bg-[#FAF8F1]/12 px-3 text-sm font-semibold">{cartCount}</span>
    </div>

    {cartItems.length === 0 ? (
      <div className="mt-10 border-t border-white/15 pt-5">
        <p className="text-base leading-7 text-[#EDE0F9]">No items yet.</p>
        <Button asChild className="mt-6 bg-[#FAF8F1] text-artisan-text hover:bg-white">
          <Link to="/gallery">Explore the gallery <ArrowRight className="ml-2" size={16} /></Link>
        </Button>
      </div>
    ) : (
      <>
        <div className="mt-7 divide-y divide-white/15 border-y border-white/15">
          {cartItems.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{item.name}</p>
                <p className="mt-1 text-sm text-[#C9A0DC]">Quantity {item.quantity}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[#C9A0DC]">Subtotal</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{formatPrice(cartSubtotal)}</p>
          </div>
          <Button asChild className="bg-[#FAF8F1] text-artisan-text hover:bg-white">
            <Link to="/cart">View cart</Link>
          </Button>
        </div>
        {cartItems.length > 3 && <p className="mt-4 text-sm text-[#C9A0DC]">Plus {cartItems.length - 3} more item{cartItems.length - 3 === 1 ? '' : 's'} in your cart.</p>}
      </>
    )}
  </aside>
);

const DashboardAction = ({ title, icon: Icon, to }) => (
  <Link to={to} className="group flex min-h-28 items-center gap-4 border-b border-[#5C2D91]/15 p-5 transition-colors duration-200 ease-out hover:bg-artisan-primary-wash/55 sm:p-6 lg:border-b-0 lg:border-r lg:last:border-r-0">
    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-artisan-primary-wash text-artisan-primary transition-transform duration-200 ease-out group-hover:scale-105">
      <Icon size={19} aria-hidden="true" />
    </span>
    <h3 className="text-lg font-semibold text-artisan-text">{title}</h3>
    <ArrowRight size={17} className="ml-auto shrink-0 text-artisan-primary transition-transform duration-200 ease-out group-hover:translate-x-1" aria-hidden="true" />
  </Link>
);

export default BuyerDashboard;
