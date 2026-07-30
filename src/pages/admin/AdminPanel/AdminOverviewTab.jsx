import React from 'react';
import { Button } from '@/components/ui/button';
import {
  isAwaitingReview,
  isDeclinedOrder,
  isPostReviewWorkflow,
} from './orderStatus';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  CheckCircle,
  X,
  AlertCircle,
  Truck,
  Clock,
  Award,
  ArrowRight,
  User,
  CalendarDays,
  CreditCard,
  Search,
  Filter,
  Eye,
  X as CloseIcon,
  Mail,
  Hash,
  Box,
  ReceiptText,
  MapPin,
  Phone,
  Wallet
} from "lucide-react";

// Receives every field the Admin controller (AdminPanel/index.jsx) computes,
// spread from its 'adminState' object. Trim this list to only what this tab
// actually uses once you've confirmed it renders correctly (delete the rest).
const AdminOverviewTab = (props) => {
  const {
    allTimeCompletedRevenue,
    avgOrderValue,
    awaitingReviewCount,
    cancellationRequestedCount,
    cancelledCount,
    completedCountAll,
    completedOrders,
    customEndDate,
    customStartDate,
    dashboardMetricsError,
    dashboardMetricsLoading,
    declinedCount,
    fetchUsers,
    filteredCompletedOrders,
    filteredOrders,
    filteredUsers,
    forecast,
    formatDateTime,
    formatDeliveryMethod,
    formatFullShippingAddress,
    formatPaymentMethod,
    formatPrice,
    formatShortDate,
    formatShortTime,
    formatStatusOptionLabel,
    getStatusBadge,
    handleCancellation,
    handleDeclineOrder,
    handleReviewOrder,
    isAdmin,
    isSubAdmin,
    loadingUsers,
    lowStockCount,
    makeSubAdmin,
    navigate,
    notifyBuyerStatusChange,
    onReviewCount,
    orderSearch,
    orderStatusFilter,
    orderStatusOptions,
    orders,
    outOfStockCount,
    paymentConfirmedCount,
    processingCount,
    productStats,
    products,
    rangeDays,
    recentOrders,
    removeSubAdmin,
    revenueChartData,
    revenueOverTimeData,
    role,
    selectedOrder,
    setCustomEndDate,
    setCustomStartDate,
    setLoadingUsers,
    setOrderSearch,
    setOrderStatusFilter,
    setOrders,
    setProductStats,
    setProducts,
    setRangeDays,
    setRole,
    setSelectedOrder,
    setTab,
    setUserSearch,
    setUsers,
    shippingCount,
    subAdminAllowedStatuses,
    tab,
    totalAllOrders,
    totalIncome,
    totalOrdersCompleted,
    updateOrderStatus,
    user,
    userSearch,
    users,
  } = props;

  const percentageOfOrders = (value) => {
    const safeTotal = Math.max(Number(totalAllOrders) || 0, 1);
    return Math.round(((Number(value) || 0) / safeTotal) * 100);
  };

  return (
              <div className="space-y-6">
                {dashboardMetricsError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                    {dashboardMetricsError} Recent orders remain available below.
                  </div>
                )}
                {dashboardMetricsLoading && !dashboardMetricsError && (
                  <p className="text-sm font-medium text-artisan-text-muted">Refreshing all-time order metrics...</p>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-6 shadow-lg shadow-[#2D0E5A]/10">
                    <Package className="mb-4 text-artisan-primary" size={34} />
                    <p className="text-3xl font-bold text-artisan-text sm:text-4xl">{products.length}</p>
                    <p className="mt-1 text-sm font-semibold text-artisan-text-muted">Total Products</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-6 shadow-lg shadow-[#2D0E5A]/10">
                    <ShoppingCart className="mb-4 text-emerald-600" size={34} />
                    <p className="text-3xl font-bold text-artisan-text sm:text-4xl">{totalAllOrders}</p>
                    <p className="mt-1 text-sm font-semibold text-artisan-text-muted">Total Orders</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-6 shadow-lg shadow-[#2D0E5A]/10">
                    <CheckCircle className="mb-4 text-sky-600" size={34} />
                    <p className="text-3xl font-bold text-artisan-text sm:text-4xl">{completedCountAll}</p>
                    <p className="mt-1 text-sm font-semibold text-artisan-text-muted">Completed Orders</p>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-6 shadow-lg shadow-[#2D0E5A]/10">
                    <Wallet className="mb-4 text-amber-600" size={34} />
                    {isSubAdmin ? (
                      <>
                        <p className="text-2xl font-bold text-red-600">Blocked</p>
                        <p className="mt-1 text-sm font-semibold text-artisan-text-muted">Total Income</p>
                        <p className="mt-2 text-sm text-artisan-text-muted">Permission blocked for sub-admin</p>
                      </>
                    ) : (
                      <>
                        <p className="break-words text-2xl font-bold text-artisan-text sm:text-3xl">
                          {formatPrice(allTimeCompletedRevenue)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-artisan-text-muted">Total Income (All-Time)</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-xl shadow-[#2D0E5A]/10 lg:col-span-2">
                    <div className="border-b border-artisan-primary/10 bg-artisan-primary-wash/55 p-6 md:p-7">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-artisan-primary/15 bg-white px-3 py-1 text-xs font-bold text-artisan-primary">
                            <ShoppingCart size={14} />
                            Live Order Feed
                          </div>
                          <h2 className="font-artisan-display text-3xl font-bold text-artisan-text">Recent Orders</h2>
                          <p className="mt-1 text-sm text-artisan-text-muted">
                            Latest customer activity with quick review and admin actions.
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => setTab("orders")}
                          className="shrink-0"
                        >
                          View all
                          <ArrowRight className="ml-2" size={16} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-5">
                        <div className="rounded-2xl border border-artisan-primary/10 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Shown here</p>
                          <p className="mt-1 text-2xl font-bold text-artisan-text">{recentOrders.length}</p>
                          <p className="mt-1 text-sm text-artisan-text-muted">Most recent orders</p>
                        </div>

                        <div className="rounded-2xl border border-artisan-primary/10 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Awaiting Review</p>
                          <p className="text-2xl font-bold text-yellow-600 mt-1">{awaitingReviewCount}</p>
                          <p className="mt-1 text-sm text-artisan-text-muted">Needs review first</p>
                        </div>

                        <div className="rounded-2xl border border-artisan-primary/10 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">On Review</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">{onReviewCount}</p>
                          <p className="mt-1 text-sm text-artisan-text-muted">Currently being reviewed</p>
                        </div>

                        <div className="rounded-2xl border border-artisan-primary/10 bg-white p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Shipping</p>
                          <p className="text-2xl font-bold text-cyan-600 mt-1">{shippingCount}</p>
                          <p className="mt-1 text-sm text-artisan-text-muted">Orders on the way</p>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-[48rem] space-y-4 overflow-y-auto bg-white p-4 md:p-6">
                      {recentOrders.length > 0 ? (
                        recentOrders.map(order => (
                          <div
                            key={order.id}
                            className="rounded-2xl border border-artisan-primary/10 bg-white p-4 shadow-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-artisan-primary/25 hover:shadow-md md:p-5"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="inline-flex items-center rounded-full bg-artisan-primary-wash px-3 py-1 text-xs font-bold text-artisan-primary">
                                        #{order.id.slice(0, 8)}
                                      </span>
                                      {getStatusBadge(order.status)}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                      <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                                          <User size={18} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Customer</p>
                                          <p className="truncate text-sm font-medium text-artisan-text">
                                            {order.buyerEmail || "Guest"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                                          <CalendarDays size={18} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Date</p>
                                          <p className="text-sm font-medium text-artisan-text">
                                            {formatShortDate(order.createdAt)}
                                          </p>
                                          <p className="mt-0.5 text-xs text-artisan-text-muted">
                                            {formatShortTime(order.createdAt)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0 lg:text-right">
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-artisan-primary-wash px-4 py-3">
                                      <CreditCard className="text-artisan-primary" size={18} />
                                      <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Total</p>
                                        <p className="text-lg font-bold text-artisan-text">
                                          {formatPrice(order.total || 0)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 border-t border-artisan-primary/10 pt-4">
                                  <div className="flex items-center justify-between gap-3 mb-3">
                                    <p className="text-sm font-semibold text-artisan-text">
                                      Items ({order.items?.length || 0})
                                    </p>
                                    <p className="text-xs text-artisan-text-muted">
                                      {formatDateTime(order.createdAt)}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    {order.items?.length ? (
                                      order.items.slice(0, 4).map((item, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center rounded-full bg-artisan-primary-wash/60 px-3 py-1.5 text-xs font-medium text-artisan-text-mid"
                                        >
                                          {item.name} × {item.quantity}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-sm text-artisan-text-muted">No items listed</span>
                                    )}

                                    {(order.items?.length || 0) > 4 && (
                                      <span className="inline-flex items-center rounded-full bg-[#F2BB16]/15 text-[#9a7400] px-3 py-1.5 text-xs font-medium">
                                        +{order.items.length - 4} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="lg:w-[220px] shrink-0">
                                <div className="flex flex-col gap-2">
                                  {isAwaitingReview(order.status) ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => handleReviewOrder(order, true)}
                                        className="w-full"
                                      >
                                        Review
                                      </Button>

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDeclineOrder(order)}
                                        className="w-full rounded-xl border-red-300 text-red-600 hover:bg-red-50"
                                      >
                                        Decline
                                      </Button>
                                    </>
                                  ) : isPostReviewWorkflow(order.status) ? (
                                    <>
                                      {isAdmin ? (
                                        <select
                                          value={order.status || "on_review"}
                                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                          className="w-full rounded-xl border border-artisan-border bg-white px-3 py-2 text-sm text-artisan-text outline-none focus:ring-2 focus:ring-artisan-primary/15"
                                        >
                                          <option value="on_review">On Review</option>
                                          <option value="payment_confirmed">Payment Confirmed</option>
                                          <option value="processing">Processing</option>
                                          <option value="shipping">Shipping</option>
                                          <option value="completed">Completed</option>
                                          <option value="cancelled">Cancelled</option>
                                        </select>
                                      ) : (
                                        subAdminAllowedStatuses.includes(order.status || "on_review") ? (
                                          <select
                                            value={order.status || "on_review"}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                            className="w-full rounded-xl border border-artisan-border bg-white px-3 py-2 text-sm text-artisan-text outline-none focus:ring-2 focus:ring-artisan-primary/15"
                                          >
                                            <option value="on_review">On Review</option>
                                            <option value="payment_confirmed">Payment Confirmed</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipping">Shipping</option>
                                          </select>
                                        ) : (
                                          <div className="w-full rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/45 px-3 py-2 text-sm text-artisan-text-muted">
                                            Status locked for sub-admin
                                          </div>
                                        )
                                      )}

                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setTab("orders");
                                          setSelectedOrder(order);
                                        }}
                                        className="w-full rounded-xl"
                                      >
                                        Open Full Order
                                      </Button>
                                    </>
                                  ) : isDeclinedOrder(order.status) ? (
                                    <div className="w-full px-3 py-2 border border-red-200 rounded-xl text-sm bg-red-50 text-red-600 font-medium text-center">
                                      Order declined
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setTab("orders");
                                        setSelectedOrder(order);
                                      }}
                                      className="w-full rounded-xl"
                                    >
                                      Open Full Order
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-3xl border border-dashed border-artisan-primary/20 bg-artisan-primary-wash/20 p-12 text-center text-artisan-text-muted">
                          <ShoppingCart size={56} className="mx-auto mb-4 text-artisan-primary-pale" />
                          <p className="text-lg font-semibold text-artisan-text">No recent orders yet</p>
                          <p className="mt-1 text-sm">New customer orders will show up here automatically.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-6 shadow-lg shadow-[#2D0E5A]/10">
                      <h3 className="mb-4 font-artisan-display text-2xl font-bold text-artisan-text">Needs Attention</h3>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-xl bg-amber-50 p-3 text-artisan-text">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="text-yellow-600" size={18} />
                            <span>Orders awaiting review</span>
                          </div>
                          <button
                            className="text-sm font-bold text-artisan-primary hover:underline"
                            onClick={() => {
                              setTab("orders");
                              setOrderStatusFilter("awaiting_review");
                            }}
                          >
                            {awaitingReviewCount}
                          </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-orange-50 p-3 text-artisan-text">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="text-orange-600" size={18} />
                            <span>Cancellation requests</span>
                          </div>
                          <button
                            className="text-sm font-bold text-artisan-primary hover:underline"
                            onClick={() => setTab("orders")}
                          >
                            {cancellationRequestedCount}
                          </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-rose-50 p-3 text-artisan-text">
                          <div className="flex items-center gap-2 text-sm">
                            <X className="text-red-600" size={18} />
                            <span>Out of stock</span>
                          </div>
                          <button
                            className="text-sm font-bold text-artisan-primary hover:underline"
                            onClick={() => setTab("analytics")}
                          >
                            {outOfStockCount}
                          </button>
                        </div>

                        <div className="flex items-center justify-between rounded-xl bg-amber-50/70 p-3 text-artisan-text">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="text-yellow-600" size={18} />
                            <span>Low stock (≤ 5)</span>
                          </div>
                          <button
                            className="text-sm font-bold text-artisan-primary hover:underline"
                            onClick={() => setTab("analytics")}
                          >
                            {lowStockCount}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-6 shadow-lg shadow-[#2D0E5A]/10">
                      <h3 className="mb-4 font-artisan-display text-2xl font-bold text-artisan-text">Quick Actions</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <Button onClick={() => setTab("orders")}>
                          Manage Orders
                        </Button>
                        <Button variant="outline" onClick={() => setTab("analytics")}>
                          View Analytics
                        </Button>
                        <Button variant="outline" onClick={() => setTab("users")}>
                          Manage Users
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/message-center')}>
                          Open Message Center
                        </Button>
                        <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                          Back to Top
                        </Button>
                      </div>
                      <p className="mt-3 text-xs text-artisan-text-muted">
                        Tip: Use “Needs Attention” for priority tasks.
                      </p>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-6 shadow-lg shadow-[#2D0E5A]/10">
                      <h3 className="mb-4 font-artisan-display text-2xl font-bold text-artisan-text">Order Status Breakdown</h3>

                      <div className="space-y-3 text-sm">
                        {[
                          { label: "Awaiting Review", value: awaitingReviewCount, bar: "bg-yellow-400" },
                          { label: "On Review", value: onReviewCount, bar: "bg-blue-400" },
                          { label: "Payment Confirmed", value: paymentConfirmedCount, bar: "bg-emerald-400" },
                          { label: "Processing", value: processingCount, bar: "bg-sky-400" },
                          { label: "Shipping", value: shippingCount, bar: "bg-cyan-400" },
                          { label: "Completed", value: completedCountAll, bar: "bg-green-500" },
                          { label: "Declined", value: declinedCount, bar: "bg-red-400" },
                          { label: "Cancelled/Refund", value: cancelledCount, bar: "bg-gray-500" },
                        ].map(row => (
                          <div key={row.label}>
                            <div className="flex justify-between mb-1">
                              <span className="text-artisan-text-muted">{row.label}</span>
                              <span className="font-bold text-artisan-text">{row.value} ({percentageOfOrders(row.value)}%)</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-artisan-primary-wash">
                              <div className={`h-full ${row.bar}`} style={{ width: `${percentageOfOrders(row.value)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
  );
};

export default AdminOverviewTab;
