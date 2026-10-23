import React from 'react';
import {
  AlertCircle, ArrowRight, ArrowUp, BarChart3, CheckCircle, Clock,
  MessageCircle, Package, ShoppingCart, Truck, Users, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hasOpenStatusCorrectionRequest } from './orderStatus';
import styles from './AdminDashboard.module.css';

const MetricCard = ({ icon: Icon, label, value, detail, tone = 'violet', scope = 'All time', loading }) => (
  <article className={styles.metric} data-tone={tone}>
    <div className="flex items-center justify-between gap-2">
      <span className={styles.iconTile}><Icon size={20} aria-hidden="true" /></span>
      <span className={styles.eyebrow}>{scope}</span>
    </div>
    <h3 className="mt-4 text-sm font-semibold text-artisan-text-muted">{label}</h3>
    {loading ? (
      <div className={styles.skeleton} role="status" aria-label={`Loading ${label}`} />
    ) : (
      <p className={styles.metricValue}>{value}</p>
    )}
    <p className="mt-1 text-xs leading-5 text-artisan-text-muted">{detail}</p>
  </article>
);

const TaskRow = ({ icon: Icon, label, detail, count, onClick, tone = 'violet' }) => (
  <button type="button" className={styles.taskRow} data-tone={count > 0 ? tone : 'quiet'} onClick={onClick}>
    <span className={styles.iconTile}><Icon size={18} aria-hidden="true" /></span>
    <span className="min-w-0 flex-1 text-left">
      <span className="block text-sm font-bold text-artisan-text">{label}</span>
      <span className="mt-0.5 block text-xs leading-5 text-artisan-text-muted">{detail}</span>
    </span>
    <span className={styles.taskCount}>{count}</span>
    <ArrowRight size={16} className={styles.actionArrow} aria-hidden="true" />
  </button>
);

const RecentOrder = ({ order, formatPrice, formatShortDate, formatShortTime, getStatusBadge, onOpen }) => {
  const needsAttention = hasOpenStatusCorrectionRequest(order);
  return (
    <article className={styles.orderCard} data-attention={needsAttention || undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-extrabold tabular-nums text-artisan-text">#{order.id.slice(0, 8)}</span>
          {getStatusBadge(order.status)}
        </div>
        <p className="text-lg font-extrabold tabular-nums text-artisan-text">{formatPrice(order.total || 0)}</p>
      </div>
      {needsAttention && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <p className="flex items-center gap-2 font-bold"><AlertCircle size={16} aria-hidden="true" />Needs special attention</p>
          <p className="mt-1 break-words leading-6">Sub-admin request: {order.statusCorrectionRequest.message}</p>
        </div>
      )}
      <p className="mt-3 break-all text-sm font-semibold text-artisan-text">{order.buyerEmail || 'Guest customer'}</p>
      <p className="mt-1 text-xs text-artisan-text-muted">
        {formatShortDate(order.createdAt)} · {formatShortTime(order.createdAt)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {order.items?.length ? order.items.slice(0, 3).map((item, index) => (
          <span key={`${item.id || item.name}-${index}`} className={styles.itemTag}>{item.name} × {item.quantity}</span>
        )) : <span className="text-xs text-artisan-text-muted">No items listed</span>}
        {(order.items?.length || 0) > 3 && <span className={styles.itemTag}>+{order.items.length - 3} more</span>}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-artisan-primary/10 pt-3">
        <span className="text-xs text-artisan-text-muted">{order.items?.length || 0} {order.items?.length === 1 ? 'product type' : 'product types'}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onOpen} aria-label={`Open order ${order.id.slice(0, 8)}`}>
          Open order<ArrowRight size={15} className="ml-2" aria-hidden="true" />
        </Button>
      </div>
    </article>
  );
};

const AdminOverviewTab = ({
  allTimeCompletedRevenue, awaitingReviewCount, cancellationRequestedCount,
  cancelledCount, completedCountAll, dashboardMetricsError, dashboardMetricsLoading,
  declinedCount, formatPrice, formatShortDate, formatShortTime, getStatusBadge,
  isAdmin, isSubAdmin, lowStockCount, navigate, onReviewCount, orders,
  outOfStockCount, paymentConfirmedCount, processingCount, products, recentOrders,
  setOrderSearch, setOrderStatusFilter, setOrderView, setSelectedOrder, setTab,
  shippingCount, totalAllOrders,
}) => {
  const openOrders = (status = 'all') => {
    setOrderSearch('');
    setOrderStatusFilter(status);
    setOrderView('active');
    setTab('orders');
  };
  const specialAttentionCount = orders.filter((order) =>
    !order.archive?.isArchived && hasOpenStatusCorrectionRequest(order)
  ).length;
  const acceptedCount = orders.filter((order) => order.status === 'accepted').length;
  const inProgressCount = onReviewCount + acceptedCount + paymentConfirmedCount + processingCount + shippingCount;
  const hasAttentionItems = awaitingReviewCount + cancellationRequestedCount + specialAttentionCount + lowStockCount + outOfStockCount > 0;
  const statusRows = [
    { label: 'Awaiting review', value: awaitingReviewCount, tone: 'amber' },
    { label: 'On review', value: onReviewCount, tone: 'violet' },
    { label: 'Accepted', value: acceptedCount, tone: 'violet' },
    { label: 'Payment confirmed', value: paymentConfirmedCount, tone: 'green' },
    { label: 'Processing', value: processingCount, tone: 'violet' },
    { label: 'Shipped', value: shippingCount, tone: 'violet' },
    { label: 'Completed', value: completedCountAll, tone: 'green' },
    { label: 'Cancellation requested', value: cancellationRequestedCount, tone: 'amber' },
    { label: 'Declined', value: declinedCount, tone: 'quiet' },
    { label: 'Cancelled / refund', value: cancelledCount, tone: 'quiet' },
  ];
  const quickActions = [
    { label: 'Manage orders', detail: 'Review and update customer orders', icon: ShoppingCart, onClick: () => openOrders() },
    { label: 'Messages', detail: 'Reply to customer inquiries', icon: MessageCircle, onClick: () => navigate('/message-center') },
    { label: 'Product gallery', detail: 'View and edit your pieces', icon: Package, onClick: () => navigate('/gallery') },
    ...(isAdmin ? [
      { label: 'Analytics', detail: 'Understand sales and performance', icon: BarChart3, onClick: () => setTab('analytics') },
      { label: 'Manage users', detail: 'View accounts and admin access', icon: Users, onClick: () => setTab('users') },
    ] : []),
  ];

  return (
    <div className={styles.overview}>
      {dashboardMetricsError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {dashboardMetricsError} Recent orders remain available below.
        </div>
      )}
      <section aria-labelledby="store-summary-title">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="store-summary-title" className={styles.sectionTitle}>The big picture</h2>
            <p className={styles.sectionDescription}>Your store totals, across all recorded activity.</p>
          </div>
          <span className={styles.scopeTag}><Clock size={13} aria-hidden="true" />All-time totals</span>
        </div>
        <div className={styles.metricGrid} aria-busy={dashboardMetricsLoading || undefined}>
          <MetricCard icon={Package} label="Products in gallery" value={products.length} detail="Includes pieces for display" scope="Catalog" />
          <MetricCard icon={ShoppingCart} label="Total orders" value={totalAllOrders} detail="Across all order statuses" loading={dashboardMetricsLoading} />
          <MetricCard icon={CheckCircle} label="Completed orders" value={completedCountAll} detail="Orders marked as completed" tone="green" loading={dashboardMetricsLoading} />
          {isSubAdmin ? (
            <MetricCard icon={Truck} label="Orders in progress" value={inProgressCount} detail="From review through shipping" scope="In progress" loading={dashboardMetricsLoading} />
          ) : (
            <MetricCard icon={Wallet} label="Completed revenue" value={formatPrice(allTimeCompletedRevenue)} detail="From completed orders only" tone="amber" loading={dashboardMetricsLoading} />
          )}
        </div>
      </section>
      <div className={styles.workspaceGrid}>
        <section className={`${styles.panel} ${styles.attentionPanel}`} aria-labelledby="attention-title">
          <div className={styles.panelHeading}>
            <div><p className={styles.eyebrow}>Start here</p><h2 id="attention-title" className={styles.sectionTitle}>Your next steps</h2></div>
            <span className={styles.iconTile} data-tone={hasAttentionItems ? 'amber' : 'green'}>
              {hasAttentionItems ? <Clock size={22} aria-hidden="true" /> : <CheckCircle size={22} aria-hidden="true" />}
            </span>
          </div>
          <p className="mb-4 text-sm leading-6 text-artisan-text-muted">
            {hasAttentionItems ? 'Choose a task to go straight to the right workspace.' : 'No review or stock alerts right now. You’re all caught up.'}
          </p>
          <div className="space-y-2">
            <TaskRow icon={Clock} label="Review new orders" detail="Check requests before accepting" count={awaitingReviewCount} tone="amber" onClick={() => openOrders('awaiting_review')} />
            {specialAttentionCount > 0 && <TaskRow icon={AlertCircle} label="Special attention" detail="Review sub-admin correction requests" count={specialAttentionCount} tone="amber" onClick={() => openOrders()} />}
            <TaskRow icon={AlertCircle} label="Cancellation requests" detail="Check customer cancellation requests" count={cancellationRequestedCount} tone="amber" onClick={() => openOrders('Cancellation Requested')} />
            <TaskRow icon={Package} label="Out of stock" detail="Saleable products with no stock" count={outOfStockCount} tone="amber" onClick={() => navigate('/gallery')} />
            <TaskRow icon={Package} label="Running low" detail="Saleable products with 1–5 left" count={lowStockCount} tone="amber" onClick={() => navigate('/gallery')} />
          </div>
        </section>
        <section className={`${styles.panel} ${styles.recentPanel}`} aria-labelledby="recent-orders-title">
          <div className={styles.panelHeading}>
            <div><p className={styles.eyebrow}>Order desk</p><h2 id="recent-orders-title" className={styles.sectionTitle}>Recent orders</h2></div>
            <Button type="button" variant="outline" size="sm" onClick={() => openOrders()}>View all<ArrowRight size={15} className="ml-2" aria-hidden="true" /></Button>
          </div>
          <p className="mb-5 text-sm leading-6 text-artisan-text-muted">Up to five orders, with special-attention requests first.</p>
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <RecentOrder key={order.id} order={order} formatPrice={formatPrice}
                  formatShortDate={formatShortDate} formatShortTime={formatShortTime} getStatusBadge={getStatusBadge}
                  onOpen={() => { openOrders(); setSelectedOrder(order); }} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}><ShoppingCart size={32} aria-hidden="true" /></span>
              <h3 className="mt-5 text-lg font-bold text-artisan-text">Ready for your first order</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-artisan-text-muted">New customer orders will appear here. In the meantime, take a look at your product gallery.</p>
              <Button type="button" variant="outline" className="mt-5" onClick={() => navigate('/gallery')}>View gallery<ArrowRight size={15} className="ml-2" aria-hidden="true" /></Button>
            </div>
          )}
        </section>
        <section className={`${styles.panel} ${styles.statusPanel}`} aria-labelledby="order-status-title">
          <div className={styles.panelHeading}>
            <div><p className={styles.eyebrow}>Order journey</p><h2 id="order-status-title" className={styles.sectionTitle}>Where orders stand</h2></div>
            <Truck size={22} className="text-artisan-primary" aria-hidden="true" />
          </div>
          <p className="mb-5 text-sm leading-6 text-artisan-text-muted">Each count is a share of all {totalAllOrders} orders.</p>
          <dl className="space-y-3.5">
            {statusRows.map(({ label, value, tone }) => {
              const share = totalAllOrders > 0 ? Math.min(100, Math.max(0, (value / totalAllOrders) * 100)) : 0;
              return (
                <div key={label} data-tone={tone}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                    <dt className="font-semibold text-artisan-text-muted">{label}</dt>
                    <dd className="shrink-0 tabular-nums text-artisan-text"><strong>{value}</strong><span className="ml-2 text-artisan-text-muted">{Math.round(share)}%</span></dd>
                  </div>
                  <div className={styles.statusTrack} aria-hidden="true"><div className={styles.statusFill} style={{ transform: `scaleX(${share / 100})` }} /></div>
                </div>
              );
            })}
          </dl>
          {totalAllOrders === 0 && <p className="mt-4 text-xs leading-5 text-artisan-text-muted">This breakdown will fill in as customer orders arrive.</p>}
        </section>
      </div>
      <section aria-labelledby="quick-actions-title">
        <div className={styles.sectionHeading}>
          <div><h2 id="quick-actions-title" className={styles.sectionTitle}>Around your store</h2><p className={styles.sectionDescription}>Handy shortcuts for the rest of your work.</p></div>
        </div>
        <div className={styles.shortcutGrid}>
          {quickActions.map(({ label, detail, icon: Icon, onClick }) => (
            <button type="button" key={label} onClick={onClick} className={styles.shortcut}>
              <Icon size={21} className="text-artisan-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-left"><span className="block text-sm font-bold text-artisan-text">{label}</span><span className="mt-1 block text-xs leading-5 text-artisan-text-muted">{detail}</span></span>
              <ArrowRight size={15} className={styles.actionArrow} aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}>Back to top<ArrowUp size={15} className="ml-2" aria-hidden="true" /></Button>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
