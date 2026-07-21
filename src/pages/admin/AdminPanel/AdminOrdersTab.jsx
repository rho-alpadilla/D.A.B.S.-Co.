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

  return (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6 border-b bg-gray-50 space-y-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-[#118C8C]">Customer Orders</h2>
                      <p className="text-gray-600">Manage reviews, declines, cancellations, and status updates</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3 min-w-[120px]">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
                        <p className="text-xl font-bold text-gray-900">{orders.length}</p>
                      </div>
                      <div className="rounded-2xl bg-white border border-gray-200 px-4 py-3 min-w-[120px]">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Showing</p>
                        <p className="text-xl font-bold text-[#118C8C]">{filteredOrders.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
                    <div className="relative">
                      <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <input
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Search by order ID, customer email, or item name..."
                        className="w-full border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                      />
                    </div>

                    <div className="relative">
                      <Filter
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="w-full appearance-none border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
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

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-4 text-left">Date Ordered</th>
                        <th className="p-4 text-left">Order ID</th>
                        <th className="p-4 text-left">Customer</th>
                        <th className="p-4 text-left">Items</th>
                        <th className="p-4 text-left">Total</th>
                        <th className="p-4 text-left">Status</th>
                        <th className="p-4 text-left">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredOrders.map(order => (
                        <tr
                          key={order.id}
                          className="border-t hover:bg-gray-50 cursor-pointer"
                          onClick={() => !isAwaitingReview(order.status) && setSelectedOrder(order)}
                        >
                          <td className="p-4 text-sm text-gray-700">
                            {order.createdAt?.toDate?.().toLocaleDateString() || "N/A"}
                          </td>

                          <td className="p-4 font-medium">#{order.id.slice(0, 8)}</td>
                          <td className="p-4">{order.buyerEmail || "Guest"}</td>
                          <td className="p-4">
                            <ul className="text-sm">
                              {order.items?.map((item, i) => (
                                <li key={i}>• {item.name} (x{item.quantity})</li>
                              ))}
                            </ul>
                          </td>
                          <td className="p-4 font-bold">{formatPrice(order.total || 0)}</td>
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
                                    className="bg-[#118C8C] hover:bg-[#0d7070] text-white"
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
                                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                        className="px-3 py-1 border rounded text-sm bg-white"
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
                                          className="px-3 py-1 border rounded text-sm bg-white"
                                        >
                                          <option value="on_review">On Review</option>
                                          <option value="payment_confirmed">Payment Confirmed</option>
                                          <option value="processing">Processing</option>
                                          <option value="shipping">Shipping</option>
                                        </select>
                                      ) : (
                                        <span className="px-3 py-1 border rounded text-sm bg-gray-50 text-gray-500 inline-block">
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
                                  onClick={() => handleCancellation(order.id, "approve")}
                                  className="bg-orange-600 hover:bg-orange-700 text-white"
                                >
                                  Approve Cancellation
                                </Button>
                              )}

                              {isAdmin && order.status === "Cancelled – Pending Refund" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCancellation(order.id, "refunded")}
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

                  {orders.length === 0 && (
                    <div className="p-20 text-center text-gray-500">
                      <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
                      <p>No orders yet</p>
                    </div>
                  )}

                  {orders.length > 0 && filteredOrders.length === 0 && (
                    <div className="p-20 text-center text-gray-500">
                      <Search size={56} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-semibold text-gray-700">No matching orders</p>
                      <p className="text-sm mt-1">
                        Try a different search term or change the status filter.
                      </p>
                    </div>
                  )}
                </div>
              </div>
  );
};

export default AdminOrdersTab;
