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
const AdminUsersTab = (props) => {
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
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="p-6 border-b bg-gradient-to-r from-[#118C8C]/10 via-white to-[#F2BB16]/10">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-[#118C8C]">Sub-admin Management</h2>
                      <p className="text-gray-600 text-sm mt-1">
                        Search users and promote trusted buyer accounts to Sub-admin / Artisan.
                      </p>
                    </div>

                    <Button
                      onClick={fetchUsers}
                      className="bg-[#118C8C] hover:bg-[#0d7070] text-white rounded-xl"
                    >
                      Reload Users
                    </Button>
                  </div>

                  {!isAdmin && (
                    <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                      You can view users, but only the main admin can promote or remove Sub-admin accounts.
                    </div>
                  )}

                  <div className="relative mt-5">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search by name, email, or role..."
                      className="w-full border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#118C8C]/30 bg-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {loadingUsers ? (
                    <div className="p-16 text-center text-gray-500">
                      Loading users...
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="p-4 text-left">Name</th>
                          <th className="p-4 text-left">Email</th>
                          <th className="p-4 text-left">Current Role</th>
                          <th className="p-4 text-left">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredUsers.map((u) => {
                          const userRole = u.role || "buyer";
                          const displayName = u.name || u.displayName || "No name";
                          const isCurrentUser = u.id === user?.uid;

                          return (
                            <tr key={u.id} className="border-t hover:bg-gray-50">
                              <td className="p-4 font-medium text-gray-900">
                                <div className="flex flex-col">
                                  <span>{displayName}</span>
                                  {isCurrentUser && (
                                    <span className="text-xs text-[#118C8C] font-semibold mt-1">
                                      Current user
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="p-4 text-gray-700">
                                {u.email || "No email"}
                              </td>

                              <td className="p-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    userRole === "admin"
                                      ? "bg-purple-100 text-purple-700"
                                      : userRole === "sub-admin"
                                        ? "bg-[#118C8C]/10 text-[#118C8C]"
                                        : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {userRole}
                                </span>
                              </td>

                              <td className="p-4">
                                {userRole === "admin" ? (
                                  <span className="text-sm text-gray-400 font-semibold">
                                    Protected
                                  </span>
                                ) : !isAdmin ? (
                                  <span className="text-sm text-gray-400 font-semibold">
                                    View only
                                  </span>
                                ) : userRole === "sub-admin" ? (
                                  <Button
                                    size="sm"
                                    onClick={() => removeSubAdmin(u.id)}
                                    disabled={isCurrentUser}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Remove Sub-admin
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => makeSubAdmin(u.id)}
                                    disabled={isCurrentUser}
                                    className="bg-[#118C8C] hover:bg-[#0d7070] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    Make Sub-admin
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {!loadingUsers && users.length === 0 && (
                    <div className="p-16 text-center text-gray-500">
                      <User size={56} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-semibold text-gray-700">No users loaded yet</p>
                      <p className="text-sm mt-1">Users auto-load when you open this tab. If it still fails, check the alert message and Firestore rules.</p>
                    </div>
                  )}

                  {!loadingUsers && users.length > 0 && filteredUsers.length === 0 && (
                    <div className="p-16 text-center text-gray-500">
                      <Search size={56} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-semibold text-gray-700">No matching users</p>
                      <p className="text-sm mt-1">Try searching a different name, email, or role.</p>
                    </div>
                  )}
                </div>
              </div>
  );
};

export default AdminUsersTab;
