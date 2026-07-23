import React from 'react';
import { Button } from '@/components/ui/button';
import { Bar, Line } from 'react-chartjs-2';
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
const AdminAnalyticsTab = (props) => {
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
    <>
              {isSubAdmin ? (
                <div className="bg-white rounded-2xl shadow-lg p-10 border border-red-100 text-center">
                  <AlertCircle size={56} className="mx-auto mb-4 text-red-500" />
                  <h2 className="text-2xl font-bold text-red-600">Permission Blocked</h2>
                  <p className="text-gray-600 mt-3 text-base">
                    Contact Main admin for analytics.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h2 className="text-2xl font-bold text-[#118C8C]">Analytics</h2>
                      <p className="text-gray-600 text-sm">
                        Showing <span className="font-bold">
                          {customStartDate && customEndDate
                            ? `${customStartDate} to ${customEndDate}`
                            : "Select a date range"}
                        </span> (completed orders)
                      </p>
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          From
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          max={customEndDate || undefined}
                          className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                          To
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          min={customStartDate || undefined}
                          className="h-11 rounded-2xl border border-gray-200 bg-white px-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCustomStartDate('');
                          setCustomEndDate('');
                        }}
                        className="h-11 rounded-2xl"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-[#118C8C] to-[#0d7070] text-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                      <DollarSign size={36} className="mb-3 opacity-90" />
                      <p className="text-3xl font-bold">{formatPrice(totalIncome)}</p>
                      <p className="text-sm opacity-90 mt-1">Total Revenue</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                      <ShoppingCart size={36} className="mb-3 opacity-90" />
                      <p className="text-3xl font-bold">{totalOrdersCompleted}</p>
                      <p className="text-sm opacity-90 mt-1">Total Orders</p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                      <TrendingUp size={36} className="mb-3 opacity-90" />
                      <p className="text-3xl font-bold">{formatPrice(avgOrderValue)}</p>
                      <p className="text-sm opacity-90 mt-1">Avg Order Value</p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center text-center">
                      <Award size={36} className="mb-3 opacity-90" />
                      <p className="text-3xl font-bold">{productStats[0]?.totalSold || 0}</p>
                      <p className="text-sm opacity-90 mt-1">Best Seller Units</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-[#118C8C] mb-4">Revenue Over Time</h3>
                    <div className="h-72">
                      <Line
                        data={revenueOverTimeData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true } }
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Based on completed orders in the selected time range.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-xl font-bold text-[#118C8C] mb-4 flex items-center gap-2">
                        <Award className="text-yellow-500" size={24} /> Top 10 Best Sellers
                      </h3>
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {productStats.slice(0, 10).map((p, i) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-sm"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-lg font-bold text-gray-400 w-6 shrink-0">#{i + 1}</span>
                              <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Img</div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{p.name}</p>
                                <p className="text-xs text-gray-600">{p.totalSold} units • {formatPrice(p.revenue)}</p>
                              </div>
                            </div>
                            <p className="text-base font-bold text-[#F2BB16] whitespace-nowrap ml-3">
                              {formatPrice(p.price)}
                            </p>
                          </div>
                        ))}
                        {productStats.length === 0 && (
                          <p className="text-center text-gray-500 py-8">No sales data yet</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                      <h3 className="text-xl font-bold text-[#118C8C] mb-4">Least Sold Products</h3>
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {productStats.slice(-10).reverse().map(p => (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg text-sm"
                          >
                            <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Img</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{p.name}</p>
                              <p className="text-xs text-gray-600">
                                {p.totalSold} sold • Stock: {p.stockQuantity || 0}
                              </p>
                            </div>
                          </div>
                        ))}
                        {productStats.length === 0 && (
                          <p className="text-center text-gray-500 py-8">No data available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-[#118C8C] mb-4">Revenue by Product (Top 10)</h3>
                    <div className="h-72">
                      <Bar
                        data={revenueChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true } }
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[#118C8C] to-[#0d7070] text-white p-10 rounded-3xl shadow-2xl text-center border border-white/20">
                    <TrendingUp size={64} className="mx-auto mb-4 opacity-90" />
                    <h3 className="text-3xl font-bold mb-3">Next Month Forecast</h3>
                    <p className="text-6xl font-extrabold">{formatPrice(Math.round(forecast.nextMonth))}</p>
                    <p className="text-xl mt-4 opacity-90">
                      Based on avg daily revenue ({formatPrice(forecast.avgDaily)}) over last {forecast.baseDays} days • +{forecast.growthPct}% growth
                    </p>
                  </div>
                </div>
              )}
    </>
  );
};

export default AdminAnalyticsTab;
