import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, db } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Eye,
  ShoppingBag,
  ArrowRight,
  ReceiptText,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/context/CurrencyContext';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';

const ACTIVE_ORDER_STATUSES = [
  'pending',
  'pending_review',
  'on_review',
  'payment_confirmed',
  'Paid / Processing',
  'processing',
  'shipping',
  'Cancellation Requested',
];

const COMPLETED_ORDER_STATUSES = ['completed'];

const CANCELLED_ORDER_STATUSES = [
  'declined',
  'cancelled',
  'Cancelled – Pending Refund',
  'Refunded',
];

const formatStatusText = (status) => {
  const map = {
    pending: 'Awaiting Review',
    pending_review: 'Awaiting Review',
    on_review: 'On Review',
    payment_confirmed: 'Payment Confirmed',
    'Paid / Processing': 'Paid / Processing',
    processing: 'Processing',
    shipping: 'Shipping',
    completed: 'Completed',
    declined: 'Declined',
    cancelled: 'Cancelled',
    'Cancellation Requested': 'Cancellation Requested',
    'Cancelled – Pending Refund': 'Cancelled – Pending Refund',
    Refunded: 'Refunded',
  };

  return map[status] || 'Awaiting Review';
};

// STATUS BADGE
const getStatusBadge = (status) => {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-700',
    pending_review: 'bg-yellow-100 text-yellow-700',
    on_review: 'bg-blue-100 text-blue-700',
    payment_confirmed: 'bg-emerald-100 text-emerald-700',
    'Paid / Processing': 'bg-blue-100 text-blue-700',
    processing: 'bg-sky-100 text-sky-700',
    shipping: 'bg-cyan-100 text-cyan-700',
    completed: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-700',
    'Cancellation Requested': 'bg-orange-100 text-orange-700',
    'Cancelled – Pending Refund': 'bg-red-100 text-red-700',
    Refunded: 'bg-purple-100 text-purple-700',
  };

  const icons = {
    pending: <Clock className="text-yellow-600" size={18} />,
    pending_review: <Clock className="text-yellow-600" size={18} />,
    on_review: <Eye className="text-blue-600" size={18} />,
    payment_confirmed: <CheckCircle className="text-emerald-600" size={18} />,
    'Paid / Processing': <CheckCircle className="text-blue-600" size={18} />,
    processing: <Package className="text-sky-600" size={18} />,
    shipping: <Truck className="text-cyan-600" size={18} />,
    completed: <CheckCircle className="text-green-600" size={18} />,
    declined: <X className="text-red-600" size={18} />,
    cancelled: <X className="text-gray-600" size={18} />,
    'Cancellation Requested': <AlertCircle className="text-orange-600" size={18} />,
    'Cancelled – Pending Refund': <AlertCircle className="text-red-600" size={18} />,
    Refunded: <CheckCircle className="text-purple-600" size={18} />,
  };

  const key = status || 'pending_review';

  return (
    <span
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
        styles[key] || 'bg-gray-100 text-gray-700'
      }`}
    >
      {icons[key] || <Clock size={18} />}
      {formatStatusText(key)}
    </span>
  );
};

const CANCEL_REASONS = [
  'Changed my mind',
  'Found a better price elsewhere',
  'Wrong size/color selected',
  'Accidental order',
  'Shipping takes too long',
  'Other',
];

const PendingOrdersPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();

  const [activeTab, setActiveTab] = useState('all');
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  const selectedStatuses = useMemo(() => {
    if (activeTab === 'all') return [];
    if (activeTab === 'active') return ACTIVE_ORDER_STATUSES;
    if (activeTab === 'completed') return COMPLETED_ORDER_STATUSES;
    if (activeTab === 'cancelled') return CANCELLED_ORDER_STATUSES;
    return [];
  }, [activeTab]);

  useEffect(() => {
    if (!user?.email) return undefined;

    setLoading(true);
    setOrdersError(null);

    return onSnapshot(
      query(collection(db, 'orders'), where('buyerEmail', '==', user.email)),
      (snapshot) => {
        const toMillis = (value) => value?.toMillis?.() || value?.toDate?.()?.getTime?.() || 0;
        const nextOrders = snapshot.docs
          .map((orderDoc) => ({ id: orderDoc.id, ...orderDoc.data() }))
          .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        setAllOrders(nextOrders);
        setLoading(false);
      },
      (error) => {
        console.error('Orders could not be loaded:', error);
        setOrdersError('Orders could not be loaded. Please try again.');
        setLoading(false);
      }
    );
  }, [user?.email]);

  useEffect(() => {
    setVisibleCount(5);
  }, [activeTab]);

  const matchingOrders = useMemo(() => (
    selectedStatuses.length
      ? allOrders.filter((order) => selectedStatuses.includes(order.status))
      : allOrders
  ), [allOrders, selectedStatuses]);

  const orders = matchingOrders.slice(0, visibleCount);
  const hasMore = matchingOrders.length > visibleCount;
  const loadingMore = false;
  const loadMore = () => setVisibleCount((count) => count + 5);
  const collapseToFirstPage = () => setVisibleCount(5);
  const countsLoading = loading;
  const orderCounts = useMemo(() => ({
    all: allOrders.length,
    active: allOrders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)).length,
    completed: allOrders.filter((order) => COMPLETED_ORDER_STATUSES.includes(order.status)).length,
    cancelled: allOrders.filter((order) => CANCELLED_ORDER_STATUSES.includes(order.status)).length,
  }), [allOrders]);

  const openCancelModal = (order) => {
    setOrderToCancel(order);
    setSelectedReason('');
    setOtherReason('');
    setCancelModalOpen(true);
  };

  const confirmCancellation = async () => {
    if (!orderToCancel || !selectedReason) return;

    const reason = selectedReason === 'Other' ? otherReason.trim() : selectedReason;

    if (selectedReason === 'Other' && !reason) {
      toast({
        title: 'Reason Required',
        description: 'Please specify your reason.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateDoc(doc(db, 'orders', orderToCancel.id), {
        status: 'Cancellation Requested',
        cancelReason: reason,
        cancellationRequestedAt: serverTimestamp(),
        cancellationRequestedBy: 'buyer',
      });

      toast({
        title: 'Cancellation Requested',
        description: 'Your request has been sent to the admin team.',
      });

      setCancelModalOpen(false);
      setOrderToCancel(null);
    } catch (err) {
      console.error('Cancel error:', err);
      toast({
        title: 'Failed',
        description: 'Could not request cancellation. Try again.',
        variant: 'destructive',
      });
    }
  };

  const canCancel = (order) => {
    return (
      ['pending', 'pending_review', 'on_review', 'Paid / Processing'].includes(order.status) &&
      !order.cancellationRequestedAt
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-artisan-primary-pale border-t-artisan-primary" aria-label="Loading orders"></div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>My Orders - D.A.B.S. Co.</title>
      </Helmet>

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#5C2D91"
            color2="#7B3FA0"
            color3="#C9A0DC"
            timeSpeed={0.25}
            colorBalance={-0.06}
            warpStrength={1.5}
            warpFrequency={3.8}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={1}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />

          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={180}
              particleSpread={10}
              speed={0.1}
              particleColors={['#FAF8FF', '#E8D8F3', '#C9A0DC']}
              moveParticlesOnHover
              particleHoverFactor={1}
              alphaParticles={false}
              particleBaseSize={120}
              sizeRandomness={1.4}
              cameraDistance={53}
              disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10 container mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/45 bg-white/95 p-7 shadow-xl shadow-[#2D0E5A]/20 backdrop-blur-md md:p-10"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-artisan-primary-pale/30 blur-3xl" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-artisan-primary/20 bg-artisan-primary-wash px-4 py-2 text-xs font-semibold uppercase tracking-wider text-artisan-primary">
                  <Sparkles size={14} />
                  Order Tracking
                </div>

                <h1 className="flex items-center gap-3 font-artisan-display text-4xl font-bold text-artisan-text md:text-5xl">
                  <Package className="text-artisan-primary" size={34} />
                  My Orders
                </h1>

                <p className="mt-3 max-w-xl text-artisan-text-muted">
                  Review your active, completed, and cancelled orders.
                </p>
              </div>

              <div className="relative flex flex-col gap-3 sm:flex-row">
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/cart"><ShoppingBag size={17} className="mr-2" />Back to Cart</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/buyer-dashboard">Dashboard <ArrowRight size={17} className="ml-2" /></Link>
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <OrderStat label="All orders" value={orderCounts.all} tone="bg-white/95" loading={countsLoading} />
            <OrderStat label="Active" value={orderCounts.active} tone="bg-amber-50/95" loading={countsLoading} />
            <OrderStat label="Completed" value={orderCounts.completed} tone="bg-emerald-50/95" loading={countsLoading} />
            <OrderStat label="Cancelled" value={orderCounts.cancelled} tone="bg-rose-50/95" loading={countsLoading} />
          </motion.div>

          {!countsLoading && orderCounts.all === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-[2rem] border border-white/45 bg-white/95 py-14 text-center shadow-xl shadow-[#2D0E5A]/15 backdrop-blur-md"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-artisan-primary-wash">
                <Package size={32} className="text-artisan-primary" />
              </div>
              <h2 className="font-artisan-display text-2xl font-bold text-artisan-text">No orders yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-artisan-text-muted">Your purchased pieces will appear here as soon as an order is placed.</p>
              <Link to="/gallery">
                <Button className="mt-6">
                  Browse Products <ArrowRight size={17} className="ml-2" />
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="overflow-hidden rounded-[2rem] border border-white/45 bg-white/95 shadow-xl shadow-[#2D0E5A]/15 backdrop-blur-md">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid min-h-0 w-full grid-cols-2 gap-2 rounded-none border-0 border-b border-artisan-primary/10 bg-artisan-primary-wash/35 p-3 sm:grid-cols-4">
                  <TabsTrigger value="all">All <span className="ml-1 opacity-70">({orderCounts.all})</span></TabsTrigger>
                  <TabsTrigger value="active">Active <span className="ml-1 opacity-70">({orderCounts.active})</span></TabsTrigger>
                  <TabsTrigger value="completed">Completed <span className="ml-1 opacity-70">({orderCounts.completed})</span></TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled <span className="ml-1 opacity-70">({orderCounts.cancelled})</span></TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-0">
                  <OrderTable
                    orders={orders}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    canLoadLess={orders.length > 10}
                    onLoadLess={collapseToFirstPage}
                    error={ordersError}
                    formatPrice={formatPrice}
                    onCancel={openCancelModal}
                    canCancel={canCancel}
                  />
                </TabsContent>

                <TabsContent value="active" className="mt-0">
                  <OrderTable
                    orders={orders}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    canLoadLess={orders.length > 10}
                    onLoadLess={collapseToFirstPage}
                    error={ordersError}
                    formatPrice={formatPrice}
                    onCancel={openCancelModal}
                    canCancel={canCancel}
                  />
                </TabsContent>

                <TabsContent value="completed" className="mt-0">
                  <OrderTable
                    orders={orders}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    canLoadLess={orders.length > 10}
                    onLoadLess={collapseToFirstPage}
                    error={ordersError}
                    formatPrice={formatPrice}
                    onCancel={openCancelModal}
                    canCancel={canCancel}
                  />
                </TabsContent>

                <TabsContent value="cancelled" className="mt-0">
                  <OrderTable
                    orders={orders}
                    hasMore={hasMore}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    canLoadLess={orders.length > 10}
                    onLoadLess={collapseToFirstPage}
                    error={ordersError}
                    formatPrice={formatPrice}
                    onCancel={openCancelModal}
                    canCancel={canCancel}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {cancelModalOpen && orderToCancel && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-7 text-artisan-text shadow-2xl sm:p-8">
                <button
                  onClick={() => setCancelModalOpen(false)}
                  type="button"
                  aria-label="Close cancellation dialog"
                  className="absolute right-4 top-4 rounded-full p-2 text-artisan-text-muted transition-colors duration-200 hover:bg-artisan-primary-wash hover:text-artisan-primary"
                >
                  <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-red-600 mb-6 flex items-center gap-3">
                  <AlertCircle size={28} /> Cancel Order?
                </h2>

                <p className="mb-6 text-artisan-text-muted">
                  Order <strong>#{orderToCancel.id.slice(0, 8)}</strong> will be cancelled. This
                  action cannot be undone.
                </p>

                <div className="mb-6">
                  <p className="mb-3 font-semibold text-artisan-text">Please select a reason:</p>
                  <div className="space-y-3">
                    {CANCEL_REASONS.map((reason) => (
                      <label key={reason} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-artisan-primary-wash/70">
                        <input
                          type="radio"
                          name="cancelReason"
                          value={reason}
                          checked={selectedReason === reason}
                          onChange={(e) => setSelectedReason(e.target.value)}
                          className="w-5 h-5 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-artisan-text">{reason}</span>
                      </label>
                    ))}
                  </div>

                  {selectedReason === 'Other' && (
                    <textarea
                      value={otherReason}
                      onChange={(e) => setOtherReason(e.target.value)}
                      placeholder="Please explain your reason..."
                      className="mt-4 h-28 w-full resize-none rounded-2xl border border-artisan-border bg-white px-4 py-3 text-artisan-text placeholder:text-artisan-text-faint focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
                      required
                    />
                  )}
                </div>

                <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                  <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
                    Nevermind
                  </Button>
                  <Button
                    onClick={confirmCancellation}
                    disabled={!selectedReason || (selectedReason === 'Other' && !otherReason.trim())}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Confirm Cancellation
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const OrderTable = ({
  orders,
  hasMore,
  loadingMore,
  onLoadMore,
  canLoadLess,
  onLoadLess,
  error,
  formatPrice,
  onCancel,
  canCancel,
}) => {
  if (orders.length === 0) {
    return (
      <div className="px-6 py-14 text-center">
        <ReceiptText size={34} className="mx-auto mb-3 text-artisan-primary-pale" />
        <p className="font-semibold text-artisan-text">No orders in this category.</p>
        <p className="mt-1 text-sm text-artisan-text-muted">Try another tab to view your order history.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-artisan-primary-wash/45 text-artisan-text">
          <tr>
            <th className="p-5 text-sm font-bold">Order ID</th>
            <th className="p-5 text-sm font-bold">Date</th>
            <th className="p-5 text-sm font-bold">Items</th>
            <th className="p-5 text-sm font-bold">Total</th>
            <th className="p-5 text-sm font-bold">Status</th>
            <th className="p-5 text-sm font-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-artisan-primary/10 transition-colors duration-200 hover:bg-artisan-primary-wash/30">
              <td className="p-5 font-semibold text-artisan-text">#{order.id.slice(0, 8)}</td>
              <td className="p-5 text-artisan-text-muted">
                {order.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
              </td>
              <td className="p-5 text-artisan-text-muted">
                {order.items?.map((item, i) => (
                  <p key={i} className="text-sm">
                    • {item.name} x{item.quantity}
                  </p>
                )) || <p className="text-sm text-gray-500">No items</p>}
              </td>
              <td className="p-5 font-bold text-artisan-primary">
                {formatPrice(order.total || order.grandTotal || 0)}
              </td>
              <td className="p-5">{getStatusBadge(order.status)}</td>
              <td className="p-5 space-y-2">
                {canCancel(order) && (
                  <Button
                    onClick={() => onCancel(order)}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Cancel Order
                  </Button>
                )}
                {order.cancelReason && (
                  <p className="text-xs italic text-artisan-text-muted">Reason: {order.cancelReason}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <div className="space-y-4 p-4 md:hidden">
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-artisan-primary/15 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-artisan-text">Order #{order.id.slice(0, 8)}</p>
                <p className="mt-1 text-sm text-artisan-text-muted">{order.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            <div className="mt-4 border-y border-artisan-primary/10 py-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-artisan-text-faint">Items</p>
              <div className="space-y-1.5 text-sm text-artisan-text-muted">
                {order.items?.map((item, index) => (
                  <p key={index}>{item.name} <span className="text-artisan-text-faint">×{item.quantity}</span></p>
                )) || <p>No items</p>}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-bold text-artisan-primary">{formatPrice(order.total || order.grandTotal || 0)}</p>
              {canCancel(order) && (
                <Button onClick={() => onCancel(order)} variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50">
                  Cancel Order
                </Button>
              )}
            </div>
            {order.cancelReason && (
              <p className="mt-3 text-xs italic text-artisan-text-muted">Reason: {order.cancelReason}</p>
            )}
          </article>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center gap-3 px-4 py-6 sm:flex-row">
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {hasMore && (
          <Button variant="outline" onClick={onLoadMore} disabled={loadingMore} className="flex items-center gap-2">
            {loadingMore ? 'Loading more orders...' : 'Load more orders'}
            <ChevronDown size={20} />
          </Button>
        )}
        {canLoadLess && (
          <Button variant="outline" onClick={onLoadLess} className="flex items-center gap-2">
            View Less
            <ChevronUp size={20} />
          </Button>
        )}
      </div>
    </div>
  );
};

const OrderStat = ({ label, value, tone, loading }) => (
  <div className={`rounded-2xl border border-white/55 p-4 shadow-lg shadow-[#2D0E5A]/10 backdrop-blur-md ${tone}`}>
    <p className="text-xs font-bold uppercase tracking-[0.12em] text-artisan-text-muted">{label}</p>
    <p className="mt-1 font-artisan-display text-3xl font-bold text-artisan-text">{loading ? '—' : value}</p>
  </div>
);

export default PendingOrdersPage;
