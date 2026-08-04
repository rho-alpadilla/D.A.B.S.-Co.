import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClearSearchButton } from '@/components/ui/clear-search-button';
import { downloadOrdersExcel, filterOrdersForExport } from '@/lib/exports/adminExports';
import { ARCHIVABLE_ORDER_STATUSES } from '@/lib/orders/orderLifecycle';
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
  Wallet,
  CheckSquare,
  Square,
  Trash2
} from "lucide-react";

// Receives every field the Admin controller (AdminPanel/index.jsx) computes,
// spread from its 'adminState' object. Trim this list to only what this tab
// actually uses once you've confirmed it renders correctly (delete the rest).
const AdminOrdersTab = (props) => {
  const {
    avgOrderValue,
    archivedOrderCount,
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
    openOrderLifecycleDialog,
    openBulkRecycleDialog,
    openBulkPermanentDeleteDialog,
    onReviewCount,
    orderSearch,
    orderStatusFilter,
    orderStatusOptions,
    orderView,
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
    setOrderView,
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
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportProductId, setExportProductId] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [selectedArchivedOrderIds, setSelectedArchivedOrderIds] = useState([]);

  useEffect(() => {
    setVisibleCount(5);
    setSelectedOrderIds([]);
    setSelectedArchivedOrderIds([]);
  }, [orderSearch, orderStatusFilter, orderView]);

  const visibleOrders = useMemo(() => {
    return filteredOrders.slice(0, visibleCount);
  }, [filteredOrders, visibleCount]);

  const hasMore = filteredOrders.length > visibleCount;
  const recyclableOrders = useMemo(() => (
    orders.filter((order) => !order.archive?.isArchived && ARCHIVABLE_ORDER_STATUSES.has(order.status))
  ), [orders]);
  const visibleRecyclableOrders = useMemo(() => (
    visibleOrders.filter((order) => ARCHIVABLE_ORDER_STATUSES.has(order.status))
  ), [visibleOrders]);
  const selectedRecyclableOrders = useMemo(() => (
    recyclableOrders.filter((order) => selectedOrderIds.includes(order.id))
  ), [recyclableOrders, selectedOrderIds]);
  const recyclableArchivedOrders = useMemo(() => (
    orders.filter((order) => order.archive?.isArchived && ARCHIVABLE_ORDER_STATUSES.has(order.status))
  ), [orders]);
  const visibleRecyclableArchivedOrders = useMemo(() => (
    visibleOrders.filter((order) => ARCHIVABLE_ORDER_STATUSES.has(order.status))
  ), [visibleOrders]);
  const selectedRecyclableArchivedOrders = useMemo(() => (
    recyclableArchivedOrders.filter((order) => selectedArchivedOrderIds.includes(order.id))
  ), [recyclableArchivedOrders, selectedArchivedOrderIds]);
  const isRecycleBinView = orderView === 'archived';
  const selectableVisibleOrders = isRecycleBinView ? visibleRecyclableArchivedOrders : visibleRecyclableOrders;
  const selectedSelectableOrders = isRecycleBinView ? selectedRecyclableArchivedOrders : selectedRecyclableOrders;
  const selectedIdsForCurrentView = isRecycleBinView ? selectedArchivedOrderIds : selectedOrderIds;
  const areVisibleOrdersSelected = selectableVisibleOrders.length > 0 && selectableVisibleOrders.every((order) => selectedIdsForCurrentView.includes(order.id));
  const hasActiveFilters = Boolean(orderSearch.trim()) || orderStatusFilter !== 'all';
  const exportProducts = useMemo(() => (
    products
      .filter((product) => product?.id && product?.name)
      .slice()
      .sort((first, second) => String(first.name).localeCompare(String(second.name)))
  ), [products]);
  const exportOrderCount = useMemo(() => (
    filterOrdersForExport({
      orders,
      startDate: exportStartDate,
      endDate: exportEndDate,
      productId: exportProductId,
    }).length
  ), [orders, exportEndDate, exportProductId, exportStartDate]);

  const clearFilters = () => {
    setOrderSearch('');
    setOrderStatusFilter('all');
  };

  const changeOrderView = (nextView) => {
    setOrderView(nextView);
    setOrderSearch('');
    setOrderStatusFilter('all');
  };

  const toggleOrderSelection = (orderId) => {
    const updateSelection = isRecycleBinView ? setSelectedArchivedOrderIds : setSelectedOrderIds;
    updateSelection((previous) => (
      previous.includes(orderId)
        ? previous.filter((id) => id !== orderId)
        : [...previous, orderId]
    ));
  };

  const toggleVisibleOrderSelection = () => {
    const visibleIds = selectableVisibleOrders.map((order) => order.id);
    const updateSelection = isRecycleBinView ? setSelectedArchivedOrderIds : setSelectedOrderIds;
    updateSelection((previous) => (
      areVisibleOrdersSelected
        ? previous.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...previous, ...visibleIds]))
    ));
  };

  useEffect(() => {
    setSelectedOrderIds((previous) => previous.filter((orderId) => (
      recyclableOrders.some((order) => order.id === orderId)
    )));
  }, [recyclableOrders]);

  useEffect(() => {
    setSelectedArchivedOrderIds((previous) => previous.filter((orderId) => (
      recyclableArchivedOrders.some((order) => order.id === orderId)
    )));
  }, [recyclableArchivedOrders]);

  const handleOrdersExport = async () => {
    if (!isAdmin) {
      setExportMessage('Only the main admin can export order data.');
      return;
    }

    if (exportStartDate && exportEndDate && exportStartDate > exportEndDate) {
      setExportMessage('Choose an end date that is on or after the start date.');
      return;
    }

    try {
      const result = await downloadOrdersExcel({
        orders,
        startDate: exportStartDate,
        endDate: exportEndDate,
        productId: exportProductId,
      });
      setExportMessage(
        `Downloaded ${result.rowCount} item row${result.rowCount === 1 ? '' : 's'} from ${result.orderCount} order${result.orderCount === 1 ? '' : 's'}, including ${result.deletionAuditCount} permanent-deletion audit record${result.deletionAuditCount === 1 ? '' : 's'}.`,
      );
    } catch (error) {
      console.error('Unable to export orders', error);
      setExportMessage('The export could not be created. Please try again.');
    }
  };

  return (
              <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-xl shadow-[#2D0E5A]/10">
                <div className="space-y-5 border-b border-artisan-primary/10 bg-artisan-primary-wash/45 p-5 sm:p-7">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Order workspace</p>
                      <h2 className="mt-1 font-nunito text-3xl font-bold text-artisan-text">Customer Orders</h2>
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

                  {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Order visibility">
                      <Button type="button" size="sm" variant={orderView === 'active' ? 'default' : 'outline'} onClick={() => changeOrderView('active')}>Active orders</Button>
                      <Button type="button" size="sm" variant={orderView === 'archived' ? 'default' : 'outline'} onClick={() => changeOrderView('archived')}>Recycle bin <span className="ml-1 opacity-80">{archivedOrderCount}</span></Button>
                      <p className="text-sm text-artisan-text-muted">{orderView === 'archived' ? 'Deleted orders can be restored and remain in exports and analytics.' : 'Deleted orders are hidden from this operational view.'}</p>
                    </div>
                  )}

                  {isAdmin && (orderView === 'active' || orderView === 'archived') && (
                    <section className="flex flex-col gap-3 border-t border-artisan-primary/10 pt-5 lg:flex-row lg:items-center lg:justify-between" aria-label="Order deletion controls">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleVisibleOrderSelection}
                          disabled={selectableVisibleOrders.length === 0}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-artisan-text transition hover:text-artisan-primary disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary"
                        >
                          {areVisibleOrdersSelected ? <CheckSquare size={18} className="text-artisan-primary" /> : <Square size={18} className="text-artisan-text-muted" />}
                          {areVisibleOrdersSelected ? 'Deselect displayed' : 'Select displayed'}
                        </button>
                        <span className="text-sm text-artisan-text-muted">{selectedSelectableOrders.length} selected</span>
                      </div>
                      {isRecycleBinView ? (
                        <Button type="button" variant="destructive" disabled={selectedRecyclableArchivedOrders.length === 0} onClick={() => openBulkPermanentDeleteDialog(selectedRecyclableArchivedOrders)}>
                          <Trash2 className="mr-2" size={16} /> Permanently delete selected ({selectedRecyclableArchivedOrders.length})
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button type="button" variant="destructive" disabled={selectedRecyclableOrders.length === 0} onClick={() => openBulkPermanentDeleteDialog(selectedRecyclableOrders, 'active-orders')}>
                            <Trash2 className="mr-2" size={16} /> Permanently delete selected ({selectedRecyclableOrders.length})
                          </Button>
                          <Button type="button" variant="outline" disabled={recyclableOrders.length === 0} onClick={() => openBulkRecycleDialog(recyclableOrders)}>
                            Move all eligible to Recycle Bin ({recyclableOrders.length})
                          </Button>
                        </div>
                      )}
                    </section>
                  )}

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
                        className="w-full rounded-2xl border border-artisan-border bg-white py-3 pl-11 pr-12 text-sm text-artisan-text outline-none transition placeholder:text-artisan-text-faint focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                      />
                      <ClearSearchButton value={orderSearch} onClear={() => setOrderSearch('')} label="Clear order search" />
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

                  {isAdmin && (
                    <section className="border-t border-artisan-primary/10 pt-5" aria-labelledby="orders-export-heading">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                          <p id="orders-export-heading" className="text-sm font-bold text-artisan-text">Export orders</p>
                          <p className="mt-1 text-sm text-artisan-text-muted">Creates a local Excel file. Shipping addresses and customer contact details are excluded.</p>
                        </div>
                        <p className="text-sm font-semibold text-artisan-text-muted">{exportOrderCount} matching order{exportOrderCount === 1 ? '' : 's'}</p>
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)_auto]">
                        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">
                          From
                          <input
                            type="date"
                            value={exportStartDate}
                            max={exportEndDate || undefined}
                            onChange={(event) => setExportStartDate(event.target.value)}
                            className="h-11 rounded-xl border border-artisan-border bg-white px-3 text-sm normal-case tracking-normal text-artisan-text outline-none transition focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">
                          To
                          <input
                            type="date"
                            value={exportEndDate}
                            min={exportStartDate || undefined}
                            onChange={(event) => setExportEndDate(event.target.value)}
                            className="h-11 rounded-xl border border-artisan-border bg-white px-3 text-sm normal-case tracking-normal text-artisan-text outline-none transition focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">
                          Product
                          <select
                            value={exportProductId}
                            onChange={(event) => setExportProductId(event.target.value)}
                            className="h-11 rounded-xl border border-artisan-border bg-white px-3 text-sm normal-case tracking-normal text-artisan-text outline-none transition focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                          >
                            <option value="">All products</option>
                            {exportProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                          </select>
                        </label>
                        <Button type="button" onClick={handleOrdersExport} className="h-11 self-end whitespace-nowrap">Download Excel</Button>
                      </div>
                      <p className="mt-2 min-h-5 text-sm text-artisan-text-muted" role="status" aria-live="polite">{exportMessage}</p>
                    </section>
                  )}
                </div>

                <div>
                  <div className="hidden max-h-[42rem] overflow-auto md:block">
                  <table className="artisan-data-table w-full min-w-[940px]">
                    <thead className="sticky top-0 z-10 shadow-sm">
                      <tr>
                        {isAdmin && (orderView === 'active' || orderView === 'archived') && (
                          <th className="w-14 p-4 text-left text-sm font-bold">
                            <input
                              type="checkbox"
                              checked={areVisibleOrdersSelected}
                              disabled={selectableVisibleOrders.length === 0}
                              onClick={(event) => event.stopPropagation()}
                              onChange={toggleVisibleOrderSelection}
                              aria-label={isRecycleBinView ? 'Select displayed completed, cancelled, or declined recycled orders' : 'Select displayed completed, cancelled, or declined orders'}
                              className="h-4 w-4 rounded border-artisan-primary/30 text-artisan-primary focus:ring-artisan-primary"
                            />
                          </th>
                        )}
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
                      {visibleOrders.map(order => {
                        const canSelectOrder = isAdmin && ARCHIVABLE_ORDER_STATUSES.has(order.status) && (
                          (orderView === 'active' && !order.archive?.isArchived)
                          || (orderView === 'archived' && order.archive?.isArchived)
                        );
                        return (
                        <tr
                          key={order.id}
                          className="cursor-pointer border-t border-artisan-primary/10 text-artisan-text transition-colors duration-200 hover:bg-artisan-primary-wash/30"
                          onClick={() => setSelectedOrder(order)}
                        >
                          {isAdmin && (orderView === 'active' || orderView === 'archived') && (
                            <td className="p-4" onClick={(event) => event.stopPropagation()}>
                              {canSelectOrder && (
                                <input
                                  type="checkbox"
                                  checked={selectedIdsForCurrentView.includes(order.id)}
                                  onChange={() => toggleOrderSelection(order.id)}
                                  aria-label={`Select order #${order.id.slice(0, 8)}`}
                                  className="h-4 w-4 rounded border-artisan-primary/30 text-artisan-primary focus:ring-artisan-primary"
                                />
                              )}
                            </td>
                          )}
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
                              className="hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {!order.archive?.isArchived && isAwaitingReview(order.status) ? (
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

                                  {!order.archive?.isArchived && isPostReviewWorkflow(order.status) && (
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

                              {isAdmin && !order.archive?.isArchived && order.status === "Cancellation Requested" && (
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
                                  disabled={Boolean(order.archive?.isArchived)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white"
                                >
                                  Mark as Refunded
                                </Button>
                              )}

                              {isAdmin && (order.archive?.isArchived ? (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => openOrderLifecycleDialog('restore', order)}>Restore</Button>
                                  {ARCHIVABLE_ORDER_STATUSES.has(order.status) && (
                                    <Button size="sm" variant="destructive" onClick={() => openOrderLifecycleDialog('deleteArchived', order)}>Permanently delete</Button>
                                  )}
                                </>
                              ) : ARCHIVABLE_ORDER_STATUSES.has(order.status) ? (
                                <Button size="sm" variant="outline" onClick={() => openOrderLifecycleDialog('archive', order)}>Delete</Button>
                              ) : null)}
                            </div>
                            <ReadOnlyOrderActions order={order} setSelectedOrder={setSelectedOrder} />
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  </div>

                  <div className="max-h-[42rem] space-y-4 overflow-y-auto p-4 md:hidden">
                    {visibleOrders.map((order) => {
                      const canSelectOrder = isAdmin && ARCHIVABLE_ORDER_STATUSES.has(order.status) && (
                        (orderView === 'active' && !order.archive?.isArchived)
                        || (orderView === 'archived' && order.archive?.isArchived)
                      );
                      return (
                      <article
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className="cursor-pointer rounded-2xl border border-artisan-primary/10 bg-white p-5 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-artisan-primary/30 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-artisan-text">Order #{order.id.slice(0, 8)}</p>
                            <p className="mt-1 text-sm text-artisan-text-muted">{order.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {canSelectOrder && (
                              <input
                                type="checkbox"
                                checked={selectedIdsForCurrentView.includes(order.id)}
                                onClick={(event) => event.stopPropagation()}
                                onChange={() => toggleOrderSelection(order.id)}
                                aria-label={`Select order #${order.id.slice(0, 8)}`}
                                className="h-4 w-4 rounded border-artisan-primary/30 text-artisan-primary focus:ring-artisan-primary"
                              />
                            )}
                            {getStatusBadge(order.status)}
                          </div>
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
                          <span className="text-xs font-medium text-artisan-text-muted">Tap card to open details</span>
                        </div>

                        <div className="mt-4">
                          <ReadOnlyOrderActions
                            order={order}
                            setSelectedOrder={setSelectedOrder}
                          />
                        </div>
                      </article>
                      );
                    })}
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
                      <Button variant="outline" size="sm" onClick={clearFilters} className="mt-5">
                        Clear filters
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-3 border-t border-artisan-primary/10 px-5 py-6 sm:flex-row sm:justify-center">
                    {hasMore && (
                      <Button variant="outline" onClick={() => setVisibleCount((count) => count + 5)}>
                        Load 5 more orders
                      </Button>
                    )}
                    {hasActiveFilters && visibleOrders.length > 0 && (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear filters
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
  openOrderLifecycleDialog,
}) => (
  <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
    {!order.archive?.isArchived && isAwaitingReview(order.status) ? (
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

        {!order.archive?.isArchived && isPostReviewWorkflow(order.status) && (
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

    {isAdmin && !order.archive?.isArchived && order.status === 'Cancellation Requested' && (
      <Button size="sm" onClick={() => handleCancellation(order, 'approve')} className="bg-orange-600 text-white hover:bg-orange-700">
        Approve Cancellation
      </Button>
    )}

    {isAdmin && order.status === 'Cancelled â€“ Pending Refund' && (
      <Button size="sm" onClick={() => handleCancellation(order, 'refunded')} disabled={Boolean(order.archive?.isArchived)} className="bg-purple-600 text-white hover:bg-purple-700">
        Mark as Refunded
      </Button>
    )}

    {isAdmin && (order.archive?.isArchived ? (
      <>
        <Button size="sm" variant="outline" onClick={() => openOrderLifecycleDialog('restore', order)}>Restore</Button>
        {ARCHIVABLE_ORDER_STATUSES.has(order.status) && (
          <Button size="sm" variant="destructive" onClick={() => openOrderLifecycleDialog('deleteArchived', order)}>Permanently delete</Button>
        )}
      </>
    ) : ARCHIVABLE_ORDER_STATUSES.has(order.status) ? (
      <Button size="sm" variant="outline" onClick={() => openOrderLifecycleDialog('archive', order)}>Delete</Button>
    ) : null)}
  </div>
);

const ReadOnlyOrderActions = ({ order, setSelectedOrder }) => (
  <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
      <Eye className="mr-2" size={14} />
      View Details
    </Button>
  </div>
);

export default AdminOrdersTab;
