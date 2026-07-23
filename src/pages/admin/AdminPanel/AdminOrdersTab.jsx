import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  isAwaitingReview,
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
const AdminOrdersTab = (props) => {
  const {
    avgOrderValue,
    awaitingReviewCount,
    cancellationRequestedCount,
    cancelledCount,
    completedCountAll,
    completedOrders,
    customEndDate,
    customStartDate,
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

  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    setVisibleCount(5);
  }, [orderSearch, orderStatusFilter]);

  const visibleOrders = useMemo(() => {
    return filteredOrders.slice(0, visibleCount);
  }, [filteredOrders, visibleCount]);

  const hasMore = filteredOrders.length > visibleCount;

  return (
              <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-xl shadow-[#2D0E5A]/10">
                <div className="space-y-5 border-b border-artisan-primary/10 bg-artisan-primary-wash/45 p-5 sm:p-7">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Order workspace</p>
                      <h2 className="mt-1 font-artisan-display text-3xl font-bold text-artisan-text">Customer Orders</h2>
                      <p className="mt-1 text-artisan-text-muted">Manage reviews, declines, cancellations, and status updates.</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <div className="min-w-[120px] rounded-2xl border border-artisan-primary/10 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Loaded</p>
                        <p className="text-xl font-bold text-artisan-text">{orders.length}</p>
                      </div>
                      <div className="min-w-[120px] rounded-2xl border border-artisan-primary/10 bg-white px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">Showing</p>
                        <p className="text-xl font-bold text-artisan-primary">{visibleOrders.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
                    <div className="relative">
                      <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-artisan-text-faint"
                      />
                      <input
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search loaded orders by ID, customer email, or item..."
                        className="w-full rounded-2xl border border-artisan-border bg-white py-3 pl-11 pr-4 text-sm text-artisan-text outline-none transition placeholder:text-artisan-text-faint focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                      />
                    </div>

                    <div className="relative">
                      <Filter
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-artisan-text-faint"
                      />
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="w-full appearance-none rounded-2xl border border-artisan-border bg-white py-3 pl-11 pr-4 text-sm text-artisan-text outline-none transition focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                      >
                        {orderStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {formatStatusOptionLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="hidden max-h-[42rem] overflow-auto md:block">
                  <table className="w-full min-w-[940px]">
                    <thead className="border-b border-artisan-primary/10 bg-artisan-primary-wash/45 text-artisan-text">
                      <tr>
                        <th className="p-4 text-left text-sm font-bold">Date Ordered</th>
                        <th className="p-4 text-left text-sm font-bold">Order ID</th>
                        <th className="p-4 text-left text-sm font-bold">Customer</th>
                        <th className="p-4 text-left text-sm font-bold">Items</th>
                        <th className="p-4 text-left text-sm font-bold">Total</th>
                        <th className="p-4 text-left text-sm font-bold">Status</th>
                        <th className="p-4 text-left text-sm font-bold">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleOrders.map(order => (
                        <tr
                          key={order.id}
                          className="cursor-pointer border-t border-artisan-primary/10 text-artisan-text transition hover:bg-artisan-primary-wash/30"
                          onClick={() => !isAwaitingReview(order.status) && setSelectedOrder(order)}
                        >
                          <td className="p-4 text-sm text-artisan-text-muted">
                            {order.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                          </td>

                          <td className="p-4 font-semibold text-artisan-text">#{order.id.slice(0, 8)}</td>
                          <td className="p-4 text-artisan-text-muted">{order.buyerEmail || "Guest"}</td>
                          <td className="p-4 text-artisan-text-muted">
                            <ul className="text-sm leading-6">
                              {order.items?.map((item, i) => (
                                <li key={i}>• {item.name} (x{item.quantity})</li>
                              ))}
                            </ul>
                          </td>
                          <td className="p-4 font-bold text-artisan-primary">{formatPrice(order.total || 0)}</td>
                          <td className="p-4">{getStatusBadge(order.status)}</td>
                          <td className="p-4">
                            <div
                              className="flex flex-wrap gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isAwaitingReview(order.status) ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReviewOrder(order, true)}
                                  >
                                    Review
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeclineOrder(order)}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    Decline
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedOrder(order)}
                                  >
                                    <Eye className="mr-2" size={14} />
                                    View Details
                                  </Button>

                                  {isPostReviewWorkflow(order.status) && (
                                    isAdmin ? (
                                      <select
                                        value={order.status || "on_review"}
                                    onChange={(e) => updateOrderStatus(order, e.target.value)}
                                        className="rounded-xl border border-artisan-border bg-white px-3 py-1 text-sm text-artisan-text outline-none focus:ring-2 focus:ring-artisan-primary/15"
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
                                          onChange={(e) => updateOrderStatus(order, e.target.value)}
                                          className="rounded-xl border border-artisan-border bg-white px-3 py-1 text-sm text-artisan-text outline-none focus:ring-2 focus:ring-artisan-primary/15"
                                        >
                                          <option value="on_review">On Review</option>
                                          <option value="payment_confirmed">Payment Confirmed</option>
                                          <option value="processing">Processing</option>
                                          <option value="shipping">Shipping</option>
                                        </select>
                                      ) : (
                                        <span className="inline-block rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/45 px-3 py-1 text-sm text-artisan-text-muted">
                                          Locked
                                        </span>
                                      )
                                    )
                                  )}
                                </>
                              )}

                              {isAdmin && order.status === "Cancellation Requested" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCancellation(order, "approve")}
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  Approve Cancellation
                                </Button>
                              )}

                              {isAdmin && order.status === "Cancelled – Pending Refund" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCancellation(order, "refunded")}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  Mark as Refunded
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>

                  <div className="max-h-[42rem] space-y-4 overflow-y-auto p-4 md:hidden">
                    {visibleOrders.map((order) => (
                      <article
                        key={order.id}
                        onClick={() => !isAwaitingReview(order.status) && setSelectedOrder(order)}
                        className={`rounded-2xl border border-artisan-primary/10 bg-white p-5 shadow-sm ${
                          isAwaitingReview(order.status) ? '' : 'cursor-pointer transition hover:border-artisan-primary/30 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-artisan-text">Order #{order.id.slice(0, 8)}</p>
                            <p className="mt-1 text-sm text-artisan-text-muted">{order.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>

                        <div className="mt-4 border-y border-artisan-primary/10 py-4">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-artisan-text-faint">Customer</p>
                          <p className="mt-1 break-all text-sm font-medium text-artisan-text">{order.buyerEmail || 'Guest'}</p>

                          <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-artisan-text-faint">Items</p>
                          <ul className="mt-1.5 space-y-1 text-sm text-artisan-text-muted">
                            {order.items?.length ? order.items.slice(0, 4).map((item, index) => (
                              <li key={index}>{item.name} <span className="text-artisan-text-faint">(x{item.quantity})</span></li>
                            )) : <li>No items listed</li>}
                          </ul>
                          {(order.items?.length || 0) > 4 && (
                            <p className="mt-2 text-xs font-medium text-artisan-primary">+{order.items.length - 4} more items</p>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-lg font-bold text-artisan-primary">{formatPrice(order.total || 0)}</p>
                          {!isAwaitingReview(order.status) && <span className="text-xs font-medium text-artisan-text-muted">Tap card to open details</span>}
                        </div>

                        <div className="mt-4">
                          <OrderActions
                            order={order}
                            isAdmin={isAdmin}
                            subAdminAllowedStatuses={subAdminAllowedStatuses}
                            updateOrderStatus={updateOrderStatus}
                            handleReviewOrder={handleReviewOrder}
                            handleDeclineOrder={handleDeclineOrder}
                            handleCancellation={handleCancellation}
                            setSelectedOrder={setSelectedOrder}
                          />
                        </div>
                      </article>
                    ))}
                  </div>

                  {orders.length === 0 && (
                    <div className="p-16 text-center text-artisan-text-muted">
                      <ShoppingCart size={56} className="mx-auto mb-4 text-artisan-primary-pale" />
                      <p className="font-semibold text-artisan-text">No orders yet</p>
                      <p className="mt-1 text-sm">New customer orders will appear here automatically.</p>
                    </div>
                  )}

                  {orders.length > 0 && visibleOrders.length === 0 && (
                    <div className="p-16 text-center text-artisan-text-muted">
                      <Search size={52} className="mx-auto mb-4 text-artisan-primary-pale" />
                      <p className="text-lg font-semibold text-artisan-text">No matching orders</p>
                      <p className="mt-1 text-sm">
                        Try a different search term or change the status filter.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-3 border-t border-artisan-primary/10 px-5 py-6 sm:flex-row sm:justify-center">
                    {hasMore && (
                      <Button variant="outline" onClick={() => setVisibleCount((count) => count + 5)}>
                        Load 5 more orders
                      </Button>
                    )}
                  </div>
                </div>
              </div>
  );
};

const OrderActions = ({
  order,
  isAdmin,
  subAdminAllowedStatuses,
  updateOrderStatus,
  handleReviewOrder,
  handleDeclineOrder,
  handleCancellation,
  setSelectedOrder,
}) => (
  <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
    {isAwaitingReview(order.status) ? (
      <>
        <Button size="sm" onClick={() => handleReviewOrder(order, true)}>
          Review
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDeclineOrder(order)}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          Decline
        </Button>
      </>
    ) : (
      <>
        <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
          <Eye className="mr-2" size={14} />
          View Details
        </Button>

        {isPostReviewWorkflow(order.status) && (
          isAdmin ? (
            <select
              value={order.status || 'on_review'}
              onChange={(event) => updateOrderStatus(order, event.target.value)}
              className="rounded-xl border border-artisan-border bg-white px-3 py-1 text-sm text-artisan-text outline-none focus:ring-2 focus:ring-artisan-primary/15"
            >
              <option value="on_review">On Review</option>
              <option value="payment_confirmed">Payment Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipping">Shipping</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          ) : (
            subAdminAllowedStatuses.includes(order.status || 'on_review') ? (
              <select
                value={order.status || 'on_review'}
                onChange={(event) => updateOrderStatus(order, event.target.value)}
                className="rounded-xl border border-artisan-border bg-white px-3 py-1 text-sm text-artisan-text outline-none focus:ring-2 focus:ring-artisan-primary/15"
              >
                <option value="on_review">On Review</option>
                <option value="payment_confirmed">Payment Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipping">Shipping</option>
              </select>
            ) : (
              <span className="inline-block rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/45 px-3 py-1 text-sm text-artisan-text-muted">
                Locked
              </span>
            )
          )
        )}
      </>
    )}

    {isAdmin && order.status === 'Cancellation Requested' && (
      <Button size="sm" onClick={() => handleCancellation(order, 'approve')} className="bg-orange-600 text-white hover:bg-orange-700">
        Approve Cancellation
      </Button>
    )}

    {isAdmin && order.status === 'Cancelled â€“ Pending Refund' && (
      <Button size="sm" onClick={() => handleCancellation(order, 'refunded')} className="bg-purple-600 text-white hover:bg-purple-700">
        Mark as Refunded
      </Button>
    )}
  </div>
);

export default AdminOrdersTab;
