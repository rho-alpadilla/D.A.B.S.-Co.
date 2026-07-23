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
    analyticsError,
    analyticsLoading,
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
                <div className="rounded-[2rem] border border-red-100 bg-white/95 p-10 text-center shadow-xl shadow-[#2D0E5A]/10">
                  <AlertCircle size={56} className="mx-auto mb-4 text-red-500" />
                  <h2 className="text-2xl font-bold text-red-600">Permission Blocked</h2>
                  <p className="mt-3 text-base text-artisan-text-muted">
                    Contact Main admin for analytics.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Store reporting</p>
                      <h2 className="mt-1 font-artisan-display text-3xl font-bold text-artisan-text">Analytics</h2>
                      <p className="mt-1 text-sm text-artisan-text-muted">
                        Showing <span className="font-bold">
                          {customStartDate && customEndDate
                            ? `${customStartDate} to ${customEndDate}`
                            : "Select a date range"}
                        </span> (completed orders)
                      </p>
                      {analyticsLoading && (
                        <p className="mt-2 text-xs font-medium text-artisan-primary">Loading selected range...</p>
                      )}
                      {analyticsError && (
                        <p className="mt-2 text-xs font-medium text-red-600">{analyticsError}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">
                          From
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          max={customEndDate || undefined}
                          className="h-11 w-full rounded-xl border border-artisan-border bg-white px-4 text-sm text-artisan-text outline-none focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">
                          To
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          min={customStartDate || undefined}
                          className="h-11 w-full rounded-xl border border-artisan-border bg-white px-4 text-sm text-artisan-text outline-none focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCustomStartDate('');
                          setCustomEndDate('');
                        }}
                        className="h-11 w-full sm:w-auto"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-[1.25rem] border border-white/60 bg-white/95 p-4 shadow-lg shadow-[#2D0E5A]/10">
                      <DollarSign size={25} className="mb-2 text-artisan-primary" />
                      <p className="break-words text-2xl font-bold text-artisan-text">{formatPrice(totalIncome)}</p>
                      <p className="mt-1 text-sm font-semibold text-artisan-text-muted">Total Revenue</p>
                    </div>

                    <div className="rounded-[1.25rem] border border-white/60 bg-white/95 p-4 shadow-lg shadow-[#2D0E5A]/10">
                      <ShoppingCart size={25} className="mb-2 text-sky-600" />
                      <p className="text-3xl font-bold text-artisan-text">{totalOrdersCompleted}</p>
                      <p className="mt-1 text-sm font-semibold text-artisan-text-muted">Total Orders</p>
                    </div>

                    <div className="rounded-[1.25rem] border border-white/60 bg-white/95 p-4 shadow-lg shadow-[#2D0E5A]/10">
                      <TrendingUp size={25} className="mb-2 text-amber-600" />
                      <p className="break-words text-2xl font-bold text-artisan-text">{formatPrice(avgOrderValue)}</p>
                      <p className="mt-1 text-sm font-semibold text-artisan-text-muted">Avg Order Value</p>
                    </div>

                    <div className="rounded-[1.25rem] border border-white/60 bg-white/95 p-4 shadow-lg shadow-[#2D0E5A]/10">
                      <Award size={25} className="mb-2 text-rose-600" />
                      <p className="text-3xl font-bold text-artisan-text">{productStats[0]?.totalSold || 0}</p>
                      <p className="mt-1 text-sm font-semibold text-artisan-text-muted">Best Seller Units</p>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
                    <h3 className="mb-4 font-artisan-display text-2xl font-bold text-artisan-text">Revenue Over Time</h3>
                    <div className="h-52 sm:h-56">
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
                    <p className="mt-3 text-xs text-artisan-text-muted">
                      Based on completed orders in the selected time range.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
                      <h3 className="mb-4 flex items-center gap-2 font-artisan-display text-2xl font-bold text-artisan-text">
                        <Award className="text-amber-500" size={24} /> Top 10 Best Sellers
                      </h3>
                      <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                        {productStats.slice(0, 10).map((p, i) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/35 p-3 text-sm transition hover:bg-artisan-primary-wash/70"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="w-6 shrink-0 text-lg font-bold text-artisan-primary-pale">#{i + 1}</span>
                              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-artisan-primary-wash">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-artisan-text-faint">No Img</div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-artisan-text">{p.name}</p>
                                <p className="text-xs text-artisan-text-muted">{p.totalSold} units • {formatPrice(p.revenue)}</p>
                              </div>
                            </div>
                            <p className="ml-3 whitespace-nowrap text-base font-bold text-artisan-primary">
                              {formatPrice(p.price)}
                            </p>
                          </div>
                        ))}
                        {productStats.length === 0 && (
                          <p className="py-8 text-center text-artisan-text-muted">No sales data yet</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
                      <h3 className="mb-4 font-artisan-display text-2xl font-bold text-artisan-text">Least Sold Products</h3>
                      <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
                        {productStats.slice(-10).reverse().map(p => (
                          <div
                            key={p.id}
                            className="flex items-center gap-3 rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/35 p-3 text-sm"
                          >
                            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-artisan-primary-wash">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs text-artisan-text-faint">No Img</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-medium text-artisan-text">{p.name}</p>
                              <p className="text-xs text-artisan-text-muted">
                                {p.totalSold} sold • Stock: {p.stockQuantity || 0}
                              </p>
                            </div>
                          </div>
                        ))}
                        {productStats.length === 0 && (
                          <p className="py-8 text-center text-artisan-text-muted">No data available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
                    <h3 className="mb-4 font-artisan-display text-2xl font-bold text-artisan-text">Revenue by Product (Top 10)</h3>
                    <div className="h-52 sm:h-56">
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

                  <div className="rounded-[1.5rem] border border-white/30 bg-gradient-to-br from-[#2D0E5A] via-artisan-primary to-artisan-primary-mid p-6 text-center text-white shadow-2xl shadow-[#2D0E5A]/25 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:text-left">
                    <div className="flex items-center justify-center gap-3 sm:justify-start">
                      <TrendingUp size={34} className="shrink-0 opacity-90" />
                      <h3 className="font-artisan-display text-2xl font-bold">Next Month Forecast</h3>
                    </div>
                    <p className="mt-3 break-words text-3xl font-extrabold sm:mt-0 sm:text-4xl">{formatPrice(Math.round(forecast.nextMonth))}</p>
                    <p className="mt-3 text-sm text-white/85 sm:mt-0 sm:max-w-sm">
                      Based on avg daily revenue ({formatPrice(forecast.avgDaily)}) over last {forecast.baseDays} days • +{forecast.growthPct}% growth
                    </p>
                  </div>
                </div>
              )}
    </>
  );
};

export default AdminAnalyticsTab;
