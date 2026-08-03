import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, db } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Eye,
  Package,
  ReceiptText,
  ShoppingBag,
  Truck,
  X,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useCurrency } from '@/context/CurrencyContext';

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
const CANCELLED_ORDER_STATUSES = ['declined', 'cancelled', 'Cancelled – Pending Refund', 'Refunded'];

const STATUS_DETAILS = {
  pending: { label: 'Awaiting review', className: 'bg-amber-100 text-amber-800', icon: Clock3 },
  pending_review: { label: 'Awaiting review', className: 'bg-amber-100 text-amber-800', icon: Clock3 },
  on_review: { label: 'On review', className: 'bg-sky-100 text-sky-800', icon: Eye },
  payment_confirmed: { label: 'Payment confirmed', className: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  'Paid / Processing': { label: 'Paid / processing', className: 'bg-sky-100 text-sky-800', icon: CheckCircle2 },
  processing: { label: 'Processing', className: 'bg-sky-100 text-sky-800', icon: Package },
  shipping: { label: 'Shipping', className: 'bg-cyan-100 text-cyan-800', icon: Truck },
  completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  declined: { label: 'Declined', className: 'bg-rose-100 text-rose-800', icon: X },
  cancelled: { label: 'Cancelled', className: 'bg-stone-200 text-stone-700', icon: XCircle },
  'Cancellation Requested': { label: 'Cancellation requested', className: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  'Cancelled – Pending Refund': { label: 'Pending refund', className: 'bg-rose-100 text-rose-800', icon: AlertCircle },
  Refunded: { label: 'Refunded', className: 'bg-artisan-primary-wash text-artisan-primary', icon: CheckCircle2 },
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, navigate, user]);

  useEffect(() => {
    if (!user?.email) {
      setAllOrders([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setOrdersError(null);
    return onSnapshot(
      query(collection(db, 'orders'), where('buyerEmail', '==', user.email)),
      (snapshot) => {
        const toMillis = (value) => value?.toMillis?.() || value?.toDate?.()?.getTime?.() || 0;
        const nextOrders = snapshot.docs
          .map((orderDoc) => ({ id: orderDoc.id, ...orderDoc.data() }))
          .sort((firstOrder, secondOrder) => toMillis(secondOrder.createdAt) - toMillis(firstOrder.createdAt));

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

  const selectedStatuses = useMemo(() => {
    if (activeTab === 'active') return ACTIVE_ORDER_STATUSES;
    if (activeTab === 'completed') return COMPLETED_ORDER_STATUSES;
    if (activeTab === 'cancelled') return CANCELLED_ORDER_STATUSES;
    return [];
  }, [activeTab]);

  const matchingOrders = useMemo(() => (
    selectedStatuses.length ? allOrders.filter((order) => selectedStatuses.includes(order.status)) : allOrders
  ), [allOrders, selectedStatuses]);

  const visibleOrders = matchingOrders.slice(0, visibleCount);
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
      toast({ title: 'Reason required', description: 'Add a reason before submitting.', variant: 'destructive' });
      return;
    }

    try {
      await updateDoc(doc(db, 'orders', orderToCancel.id), {
        status: 'Cancellation Requested',
        cancelReason: reason,
        cancellationRequestedAt: serverTimestamp(),
        cancellationRequestedBy: 'buyer',
      });
      toast({ title: 'Cancellation requested', description: 'Your request was sent to the admin team.' });
      setCancelModalOpen(false);
      setOrderToCancel(null);
    } catch (error) {
      console.error('Cancel error:', error);
      toast({ title: 'Request failed', description: 'Could not request cancellation. Try again.', variant: 'destructive' });
    }
  };

  const canCancel = (order) => (
    ['pending', 'pending_review', 'on_review', 'Paid / Processing'].includes(order.status)
    && !order.cancellationRequestedAt
  );

  if (authLoading || loading) return <OrdersLoadingState />;
  if (!user) return null;

  return (
    <>
      <Helmet><title>My Orders - D.A.B.S. Co.</title></Helmet>

      <main className="artisan-grid-page min-h-screen px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col gap-5 border-b border-[#5C2D91]/25 pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-artisan-primary">Orders</p>
              <h1 className="mt-3 font-nunito text-4xl font-semibold tracking-[-0.04em] text-artisan-text sm:text-5xl">My orders</h1>
            </div>
            <nav aria-label="Order page actions" className="flex items-center gap-4 text-sm font-semibold">
              <Link to="/buyer-dashboard" className="text-artisan-text-muted transition-colors hover:text-artisan-primary">Dashboard</Link>
              <Link to="/cart" className="inline-flex items-center gap-2 rounded-full border border-[#5C2D91]/25 bg-[#FAF8F1] px-4 py-2.5 text-artisan-text transition-colors hover:bg-artisan-primary-wash">
                <ShoppingBag size={16} /> Cart
              </Link>
            </nav>
          </header>

          <dl className="mt-6 grid grid-cols-2 divide-x divide-y divide-[#5C2D91]/15 border-y border-[#5C2D91]/15 sm:grid-cols-4 sm:divide-y-0">
            <OrderStat label="All" value={orderCounts.all} />
            <OrderStat label="Active" value={orderCounts.active} />
            <OrderStat label="Completed" value={orderCounts.completed} />
            <OrderStat label="Cancelled" value={orderCounts.cancelled} />
          </dl>

          {orderCounts.all === 0 ? (
            <section className="py-20 text-center" aria-labelledby="no-orders-heading">
              <Package size={28} className="mx-auto text-artisan-primary" aria-hidden="true" />
              <h2 id="no-orders-heading" className="mt-5 font-nunito text-3xl font-semibold text-artisan-text">No orders yet</h2>
              <Button asChild className="mt-6"><Link to="/gallery">Browse gallery <ArrowRight className="ml-2" size={16} /></Link></Button>
            </section>
          ) : (
            <section className="mt-8 overflow-hidden rounded-3xl border border-[#5C2D91]/20 bg-[#FAF8F1]" aria-label="Order list">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="underline" className="grid h-auto w-full grid-cols-2 gap-0 sm:grid-cols-4">
                  <OrdersTab value="all" label="All" count={orderCounts.all} />
                  <OrdersTab value="active" label="Active" count={orderCounts.active} />
                  <OrdersTab value="completed" label="Completed" count={orderCounts.completed} />
                  <OrdersTab value="cancelled" label="Cancelled" count={orderCounts.cancelled} />
                </TabsList>

                {['all', 'active', 'completed', 'cancelled'].map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-0">
                    <OrderList
                      orders={visibleOrders}
                      hasMore={matchingOrders.length > visibleCount}
                      canLoadLess={visibleCount > 5}
                      error={ordersError}
                      formatPrice={formatPrice}
                      onCancel={openCancelModal}
                      canCancel={canCancel}
                      onLoadMore={() => setVisibleCount((count) => count + 5)}
                      onLoadLess={() => setVisibleCount(5)}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </section>
          )}
        </div>
      </main>

      {cancelModalOpen && orderToCancel && (
        <CancelOrderDialog
          order={orderToCancel}
          selectedReason={selectedReason}
          otherReason={otherReason}
          onClose={() => setCancelModalOpen(false)}
          onReasonChange={setSelectedReason}
          onOtherReasonChange={setOtherReason}
          onConfirm={confirmCancellation}
        />
      )}
    </>
  );
};

const OrdersLoadingState = () => (
  <div className="artisan-grid-page flex min-h-screen items-center justify-center px-6">
    <div className="flex items-center gap-3 rounded-full border border-[#5C2D91]/20 bg-[#FAF8F1] px-5 py-3 text-sm font-medium text-artisan-text shadow-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-artisan-primary/25 border-t-artisan-primary" aria-hidden="true" />
      Loading orders
    </div>
  </div>
);

const OrdersTab = ({ value, label, count }) => (
  <TabsTrigger variant="underline" value={value} className="px-4 py-4 text-sm font-semibold">
    {label} <span className="ml-1 font-normal">{count}</span>
  </TabsTrigger>
);

const OrderList = ({ orders, hasMore, canLoadLess, error, formatPrice, onCancel, canCancel, onLoadMore, onLoadLess }) => {
  if (!orders.length) {
    return (
      <div className="px-6 py-16 text-center">
        <ReceiptText size={28} className="mx-auto text-artisan-primary" aria-hidden="true" />
        <p className="mt-4 font-semibold text-artisan-text">No matching orders</p>
      </div>
    );
  }

  return (
    <div>
      <div className="hidden overflow-x-auto md:block">
        <table className="artisan-data-table w-full min-w-[720px] text-left">
          <thead>
            <tr className="text-xs uppercase tracking-[0.14em]">
              <th className="px-6 py-4 font-semibold">Order</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Items</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => <DesktopOrderRow key={order.id} order={order} formatPrice={formatPrice} onCancel={onCancel} canCancel={canCancel} />)}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-[#5C2D91]/15 md:hidden">
        {orders.map((order) => <MobileOrderRow key={order.id} order={order} formatPrice={formatPrice} onCancel={onCancel} canCancel={canCancel} />)}
      </div>

      <div className="flex flex-col items-center justify-center gap-3 border-t border-[#5C2D91]/15 px-4 py-5 sm:flex-row">
        {error && <p className="text-sm text-red-700">{error}</p>}
        {hasMore && <Button variant="outline" onClick={onLoadMore} className="border-[#5C2D91]/25 bg-transparent text-artisan-text hover:bg-artisan-primary-wash">Load more <ChevronDown className="ml-2" size={17} /></Button>}
        {canLoadLess && <button type="button" onClick={onLoadLess} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-artisan-primary hover:underline">Show less <ChevronUp size={17} /></button>}
      </div>
    </div>
  );
};

const DesktopOrderRow = ({ order, formatPrice, onCancel, canCancel }) => (
  <tr className="border-b border-[#5C2D91]/10 last:border-0 transition-colors duration-200 hover:bg-artisan-primary-wash/35">
    <td className="px-6 py-5 font-mono text-sm font-semibold text-artisan-text">#{order.id.slice(0, 8)}</td>
    <td className="px-6 py-5 text-sm text-artisan-text-muted">{formatOrderDate(order)}</td>
    <td className="max-w-xs px-6 py-5 text-sm text-artisan-text-muted"><OrderItems items={order.items} /></td>
    <td className="px-6 py-5 text-sm font-semibold tabular-nums text-artisan-text">{formatPrice(order.total || order.grandTotal || 0)}</td>
    <td className="px-6 py-5"><OrderStatusBadge status={order.status} /></td>
    <td className="px-6 py-5 text-right">
      {canCancel(order) && <button type="button" onClick={() => onCancel(order)} className="text-sm font-semibold text-red-700 transition-colors hover:text-red-900 hover:underline">Cancel</button>}
      {order.cancelReason && <p className="mt-1 text-xs text-artisan-text-muted">{order.cancelReason}</p>}
    </td>
  </tr>
);

const MobileOrderRow = ({ order, formatPrice, onCancel, canCancel }) => (
  <article className="px-5 py-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-mono text-sm font-semibold text-artisan-text">#{order.id.slice(0, 8)}</p>
        <p className="mt-1 text-sm text-artisan-text-muted">{formatOrderDate(order)}</p>
      </div>
      <OrderStatusBadge status={order.status} />
    </div>
    <div className="mt-5 border-t border-[#5C2D91]/12 pt-4"><OrderItems items={order.items} /></div>
    <div className="mt-5 flex items-center justify-between gap-4">
      <p className="font-semibold tabular-nums text-artisan-text">{formatPrice(order.total || order.grandTotal || 0)}</p>
      {canCancel(order) && <button type="button" onClick={() => onCancel(order)} className="text-sm font-semibold text-red-700 hover:underline">Cancel</button>}
    </div>
    {order.cancelReason && <p className="mt-3 text-sm text-artisan-text-muted">{order.cancelReason}</p>}
  </article>
);

const OrderItems = ({ items }) => (
  <div className="space-y-1 text-sm text-artisan-text-muted">
    {items?.length ? items.map((item, index) => <p key={`${item.id || item.name}-${index}`}>{item.name} <span className="text-artisan-text-faint">×{item.quantity}</span></p>) : <p>No items recorded</p>}
  </div>
);

const OrderStatusBadge = ({ status }) => {
  const details = STATUS_DETAILS[status] || STATUS_DETAILS.pending_review;
  const Icon = details.icon;
  return <span className={`inline-flex max-w-[11rem] items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${details.className}`}><Icon size={14} aria-hidden="true" /><span className="truncate">{details.label}</span></span>;
};

const OrderStat = ({ label, value }) => (
  <div className="px-4 py-4 sm:px-5">
    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-artisan-text-muted">{label}</dt>
    <dd className="mt-2 text-3xl font-semibold tabular-nums text-artisan-text">{value}</dd>
  </div>
);

const formatOrderDate = (order) => order.createdAt?.toDate?.().toLocaleDateString() || 'N/A';

const CancelOrderDialog = ({ order, selectedReason, otherReason, onClose, onReasonChange, onOtherReasonChange, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D0E5A]/45 p-4" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="cancel-order-heading" className="relative w-full max-w-md rounded-3xl bg-[#FAF8F1] p-6 text-artisan-text shadow-[0_24px_64px_rgba(45,14,90,0.3)] sm:p-8">
      <button onClick={onClose} type="button" aria-label="Close cancellation dialog" className="absolute right-4 top-4 rounded-full p-2 text-artisan-text-muted transition-colors hover:bg-artisan-primary-wash hover:text-artisan-primary"><X size={22} /></button>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Cancel order</p>
      <h2 id="cancel-order-heading" className="mt-3 font-nunito text-3xl font-semibold">#{order.id.slice(0, 8)}</h2>
      <fieldset className="mt-7">
        <legend className="text-sm font-semibold">Reason</legend>
        <div className="mt-3 space-y-1">
          {CANCEL_REASONS.map((reason) => (
            <label key={reason} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-artisan-primary-wash/60">
              <input type="radio" name="cancelReason" value={reason} checked={selectedReason === reason} onChange={(event) => onReasonChange(event.target.value)} className="h-4 w-4 text-red-600 focus:ring-red-500" />
              <span className="text-sm">{reason}</span>
            </label>
          ))}
        </div>
        {selectedReason === 'Other' && <textarea value={otherReason} onChange={(event) => onOtherReasonChange(event.target.value)} placeholder="Add a reason" className="mt-4 h-24 w-full resize-none rounded-xl border border-artisan-border bg-white px-3 py-2 text-sm text-artisan-text placeholder:text-artisan-text-faint focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200" required />}
      </fieldset>
      <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose}>Keep order</Button>
        <Button onClick={onConfirm} disabled={!selectedReason || (selectedReason === 'Other' && !otherReason.trim())} className="bg-red-700 text-white hover:bg-red-800">Request cancellation</Button>
      </div>
    </section>
  </div>
);

export default PendingOrdersPage;
