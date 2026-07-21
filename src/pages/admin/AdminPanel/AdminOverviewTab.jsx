import React from 'react';
import { Button } from '@/components/ui/button';
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

  return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-8 rounded-xl shadow text-center">
                    <Package className="mx-auto text-purple-500 mb-4" size={48} />
                    <p className="text-5xl font-bold">{products.length}</p>
                    <p className="text-gray-600">Total Products</p>
                  </div>

                  <div className="bg-white p-8 rounded-xl shadow text-center">
                    <ShoppingCart className="mx-auto text-green-500 mb-4" size={48} />
                    <p className="text-5xl font-bold">{orders.length}</p>
                    <p className="text-gray-600">Total Orders</p>
                  </div>

                  <div className="bg-white p-8 rounded-xl shadow text-center">
                    <CheckCircle className="mx-auto text-blue-500 mb-4" size={48} />
                    <p className="text-5xl font-bold">{completedCountAll}</p>
                    <p className="text-gray-600">Completed Orders</p>
                  </div>

                  <div className="bg-white p-8 rounded-xl shadow text-center">
                    <Wallet className="mx-auto text-yellow-500 mb-4" size={48} />
                    {isSubAdmin ? (
                      <>
                        <p className="text-2xl font-bold text-red-600">Blocked</p>
                        <p className="text-gray-600">Total Income</p>
                        <p className="text-sm text-gray-500 mt-2">Permission blocked for sub-admin</p>
                      </>
                    ) : (
                      <>
                        <p className="text-5xl font-bold">
                          {formatPrice(
                            completedOrders.reduce((sum, o) => sum + (o.total || 0), 0)
                          )}
                        </p>
                        <p className="text-gray-600">Total Income (All-Time)</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="p-6 md:p-7 border-b bg-gradient-to-r from-[#118C8C]/10 via-white to-[#F2BB16]/10">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#118C8C]/10 text-[#118C8C] text-xs font-bold mb-3">
                            <ShoppingCart size={14} />
                            Live Order Feed
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
                          <p className="text-gray-600 text-sm mt-1">
                            Latest customer activity with quick review and admin actions.
                          </p>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => setTab("orders")}
                          className="text-[#118C8C] border-[#118C8C] rounded-xl"
                        >
                          View all
                          <ArrowRight className="ml-2" size={16} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-5">
                        <div className="rounded-2xl bg-white border border-gray-100 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shown here</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{recentOrders.length}</p>
                          <p className="text-sm text-gray-500 mt-1">Most recent orders</p>
                        </div>

                        <div className="rounded-2xl bg-white border border-gray-100 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Awaiting Review</p>
                          <p className="text-2xl font-bold text-yellow-600 mt-1">{awaitingReviewCount}</p>
                          <p className="text-sm text-gray-500 mt-1">Needs review first</p>
                        </div>

                        <div className="rounded-2xl bg-white border border-gray-100 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">On Review</p>
                          <p className="text-2xl font-bold text-blue-600 mt-1">{onReviewCount}</p>
                          <p className="text-sm text-gray-500 mt-1">Currently being reviewed</p>
                        </div>

                        <div className="rounded-2xl bg-white border border-gray-100 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Shipping</p>
                          <p className="text-2xl font-bold text-cyan-600 mt-1">{shippingCount}</p>
                          <p className="text-sm text-gray-500 mt-1">Orders on the way</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 md:p-6 space-y-4 bg-gray-50/60">
                      {recentOrders.length > 0 ? (
                        recentOrders.map(order => (
                          <div
                            key={order.id}
                            className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition"
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="inline-flex items-center rounded-full bg-[#118C8C]/10 text-[#118C8C] px-3 py-1 text-xs font-bold">
                                        #{order.id.slice(0, 8)}
                                      </span>
                                      {getStatusBadge(order.status)}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                      <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                                          <User size={18} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Customer</p>
                                          <p className="text-sm font-medium text-gray-900 truncate">
                                            {order.buyerEmail || "Guest"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                                          <CalendarDays size={18} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Date</p>
                                          <p className="text-sm font-medium text-gray-900">
                                            {formatShortDate(order.createdAt)}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            {formatShortTime(order.createdAt)}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0 lg:text-right">
                                    <div className="inline-flex items-center gap-2 rounded-2xl bg-[#118C8C]/8 px-4 py-3">
                                      <CreditCard className="text-[#118C8C]" size={18} />
                                      <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total</p>
                                        <p className="text-lg font-bold text-gray-900">
                                          {formatPrice(order.total || 0)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <div className="flex items-center justify-between gap-3 mb-3">
                                    <p className="text-sm font-semibold text-gray-800">
                                      Items ({order.items?.length || 0})
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatDateTime(order.createdAt)}
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap gap-2">
                                    {order.items?.length ? (
                                      order.items.slice(0, 4).map((item, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-3 py-1.5 text-xs font-medium"
                                        >
                                          {item.name} × {item.quantity}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-sm text-gray-500">No items listed</span>
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
                                        className="w-full rounded-xl bg-[#118C8C] hover:bg-[#0d7070] text-white"
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
                                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#118C8C]/20"
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
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#118C8C]/20"
                                          >
                                            <option value="on_review">On Review</option>
                                            <option value="payment_confirmed">Payment Confirmed</option>
                                            <option value="processing">Processing</option>
                                            <option value="shipping">Shipping</option>
                                          </select>
                                        ) : (
                                          <div className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500">
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
                        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-500">
                          <ShoppingCart size={56} className="mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-semibold text-gray-700">No recent orders yet</p>
                          <p className="text-sm mt-1">New customer orders will show up here automatically.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-[#118C8C] mb-3">Needs Attention</h3>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="text-yellow-600" size={18} />
                            <span>Orders awaiting review</span>
                          </div>
                          <button
                            className="text-sm font-bold text-[#118C8C] hover:underline"
                            onClick={() => {
                              setTab("orders");
                              setOrderStatusFilter("awaiting_review");
                            }}
                          >
                            {awaitingReviewCount}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="text-orange-600" size={18} />
                            <span>Cancellation requests</span>
                          </div>
                          <button
                            className="text-sm font-bold text-[#118C8C] hover:underline"
                            onClick={() => setTab("orders")}
                          >
                            {cancellationRequestedCount}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <X className="text-red-600" size={18} />
                            <span>Out of stock</span>
                          </div>
                          <button
                            className="text-sm font-bold text-[#118C8C] hover:underline"
                            onClick={() => setTab("analytics")}
                          >
                            {outOfStockCount}
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <AlertCircle className="text-yellow-600" size={18} />
                            <span>Low stock (≤ 5)</span>
                          </div>
                          <button
                            className="text-sm font-bold text-[#118C8C] hover:underline"
                            onClick={() => setTab("analytics")}
                          >
                            {lowStockCount}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-[#118C8C] mb-3">Quick Actions</h3>
                      <div className="grid grid-cols-1 gap-2">
                        <Button onClick={() => setTab("orders")} className="bg-[#118C8C] hover:bg-[#0d7070] text-white">
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
                      <p className="text-xs text-gray-500 mt-3">
                        Tip: Use “Needs Attention” for priority tasks.
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-lg font-bold text-[#118C8C] mb-3">Order Status Breakdown</h3>

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
                              <span className="text-gray-700">{row.label}</span>
                              <span className="font-bold">{row.value} ({pct(row.value)}%)</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${row.bar}`} style={{ width: `${pct(row.value)}%` }} />
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
