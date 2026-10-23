import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArchiveRestore,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  Filter,
  ListChecks,
  LoaderCircle,
  Search,
  ShieldAlert,
  ShoppingCart,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClearSearchButton } from '@/components/ui/clear-search-button';
import { downloadOrdersExcel, filterOrdersForExport } from '@/lib/exports/adminExports';
import { ARCHIVABLE_ORDER_STATUSES } from '@/lib/orders/orderLifecycle';
import { hasOpenStatusCorrectionRequest, isAwaitingReview } from './orderStatus';

const IN_PROGRESS_STATUSES = new Set([
  'accepted',
  'on_review',
  'payment_confirmed',
  'processing',
  'shipping',
]);

const formatOrderDate = (createdAt) => {
  const value = createdAt?.toDate?.() ?? createdAt;
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getTotalItemQuantity = (items = []) => (
  items.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
);

const AdminOrdersTab = ({
  archivedOrderCount,
  completedCountAll,
  filteredOrders,
  formatPrice,
  formatStatusOptionLabel,
  getStatusBadge,
  isAdmin,
  openBulkPermanentDeleteDialog,
  openBulkRecycleDialog,
  orderSearch,
  orderStatusFilter,
  orderStatusOptions,
  orderView,
  orders,
  products,
  setOrderSearch,
  setOrderStatusFilter,
  setOrderView,
  setSelectedOrder,
}) => {
  const [visibleCount, setVisibleCount] = useState(5);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportProductId, setExportProductId] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [exportStatus, setExportStatus] = useState('idle');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [selectedArchivedOrderIds, setSelectedArchivedOrderIds] = useState([]);

  useEffect(() => {
    setVisibleCount(5);
    setSelectedOrderIds([]);
    setSelectedArchivedOrderIds([]);
  }, [orderSearch, orderStatusFilter, orderView]);

  const visibleOrders = useMemo(() => (
    filteredOrders.slice(0, visibleCount)
  ), [filteredOrders, visibleCount]);

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

  const needsAttentionCount = useMemo(() => (
    orders.filter((order) => (
      !order.archive?.isArchived
      && (
        isAwaitingReview(order.status)
        || order.status === 'Cancellation Requested'
        || hasOpenStatusCorrectionRequest(order)
      )
    )).length
  ), [orders]);

  const inProgressCount = useMemo(() => (
    orders.filter((order) => (
      !order.archive?.isArchived && IN_PROGRESS_STATUSES.has(order.status)
    )).length
  ), [orders]);

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

  const isRecycleBinView = orderView === 'archived';
  const selectableVisibleOrders = isRecycleBinView
    ? visibleRecyclableArchivedOrders
    : visibleRecyclableOrders;
  const selectedSelectableOrders = isRecycleBinView
    ? selectedRecyclableArchivedOrders
    : selectedRecyclableOrders;
  const selectedIdsForCurrentView = isRecycleBinView
    ? selectedArchivedOrderIds
    : selectedOrderIds;
  const areVisibleOrdersSelected = selectableVisibleOrders.length > 0
    && selectableVisibleOrders.every((order) => selectedIdsForCurrentView.includes(order.id));
  const hasActiveFilters = Boolean(orderSearch.trim()) || orderStatusFilter !== 'all';
  const hasExportFilters = Boolean(exportStartDate || exportEndDate || exportProductId);
  const hasMore = filteredOrders.length > visibleCount;

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
    const updateSelection = isRecycleBinView
      ? setSelectedArchivedOrderIds
      : setSelectedOrderIds;

    updateSelection((previous) => (
      previous.includes(orderId)
        ? previous.filter((id) => id !== orderId)
        : [...previous, orderId]
    ));
  };

  const toggleVisibleOrderSelection = () => {
    const visibleIds = selectableVisibleOrders.map((order) => order.id);
    const updateSelection = isRecycleBinView
      ? setSelectedArchivedOrderIds
      : setSelectedOrderIds;

    updateSelection((previous) => (
      areVisibleOrdersSelected
        ? previous.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...previous, ...visibleIds]))
    ));
  };

  const clearCurrentSelection = () => {
    if (isRecycleBinView) {
      setSelectedArchivedOrderIds([]);
      return;
    }

    setSelectedOrderIds([]);
  };

  const clearExportFilters = () => {
    setExportStartDate('');
    setExportEndDate('');
    setExportProductId('');
    setExportMessage('');
    setExportStatus('idle');
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
    if (isExporting) return;

    if (!isAdmin) {
      setExportMessage('Only the main admin can export order data.');
      setExportStatus('error');
      return;
    }

    if (exportStartDate && exportEndDate && exportStartDate > exportEndDate) {
      setExportMessage('Choose an end date that is on or after the start date.');
      setExportStatus('error');
      return;
    }

    setIsExporting(true);
    setExportStatus('working');
    setExportMessage('Preparing the Excel workbook. Keep this page open.');

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
      setExportStatus('success');
    } catch (error) {
      console.error('Unable to export orders', error);
      setExportMessage('The export could not be created. Please try again.');
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  const emptyStateTitle = hasActiveFilters
    ? 'No matching orders'
    : isRecycleBinView
      ? 'Recycle bin is empty'
      : 'No active orders';
  const emptyStateCopy = hasActiveFilters
    ? 'Try a different search term or change the status filter.'
    : isRecycleBinView
      ? 'Deleted eligible orders will appear here until they are restored or permanently removed.'
      : 'New customer orders will appear here automatically.';

  return (
    <section
      aria-labelledby="orders-heading"
      className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-xl shadow-[#2D0E5A]/10"
    >
      <div className="border-b border-artisan-primary/10 bg-[radial-gradient(circle_at_top_right,rgba(118,72,179,0.12),transparent_38%),linear-gradient(180deg,rgba(248,245,252,0.96),rgba(255,255,255,0.98))] p-5 sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(34rem,0.95fr)] xl:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Order workspace</p>
            <h2 id="orders-heading" className="mt-2 font-nunito text-3xl font-bold tracking-tight text-artisan-text sm:text-4xl">Orders</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-artisan-text-muted sm:text-base">
              Find an order, check its current status, and open the full details when it needs action.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <OrderSummary label="Needs attention" value={needsAttentionCount} tone="attention" />
            <OrderSummary label="In progress" value={inProgressCount} />
            <OrderSummary label="Completed" value={completedCountAll} />
            <OrderSummary label="Matching" value={filteredOrders.length} tone="primary" />
          </dl>
        </div>

        {isAdmin && (
          <div className="mt-6 flex flex-col gap-3 border-t border-artisan-primary/10 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex w-fit rounded-xl border border-artisan-primary/10 bg-white/80 p-1 shadow-sm" role="group" aria-label="Order visibility">
              <button type="button" aria-pressed={orderView === 'active'} onClick={() => changeOrderView('active')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary ${orderView === 'active' ? 'bg-artisan-primary text-white shadow-sm' : 'text-artisan-text-muted hover:bg-artisan-primary-wash hover:text-artisan-text'}`}>
                Active orders
              </button>
              <button type="button" aria-pressed={orderView === 'archived'} onClick={() => changeOrderView('archived')} className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary ${orderView === 'archived' ? 'bg-artisan-primary text-white shadow-sm' : 'text-artisan-text-muted hover:bg-artisan-primary-wash hover:text-artisan-text'}`}>
                Recycle bin <span className="ml-1 tabular-nums opacity-80">{archivedOrderCount}</span>
              </button>
            </div>
            <p className="max-w-xl text-sm leading-5 text-artisan-text-muted">
              {isRecycleBinView ? 'Deleted orders stay available for restoration, exports, and analytics.' : 'This view keeps current work separate from orders moved to the recycle bin.'}
            </p>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-artisan-primary/10 bg-white/90 p-3 shadow-sm sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
            <label htmlFor="order-search" className="relative block">
              <span className="sr-only">Search orders</span>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-artisan-text-faint" />
              <input id="order-search" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Search by order ID, customer email, or item" className="h-12 w-full rounded-xl border border-artisan-border bg-white pl-11 pr-12 text-sm text-artisan-text outline-none transition placeholder:text-artisan-text-faint hover:border-artisan-primary/40 focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15" />
              <ClearSearchButton value={orderSearch} onClear={() => setOrderSearch('')} label="Clear order search" />
            </label>

            <label htmlFor="order-status-filter" className="relative block">
              <span className="sr-only">Filter orders by status</span>
              <Filter size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-artisan-text-faint" />
              <select id="order-status-filter" value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-artisan-border bg-white pl-11 pr-9 text-sm font-medium text-artisan-text outline-none transition hover:border-artisan-primary/40 focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15">
                {orderStatusOptions.map((status) => <option key={status} value={status}>{formatStatusOptionLabel(status)}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-artisan-text-muted" aria-live="polite">
              Showing <span className="font-bold tabular-nums text-artisan-text">{visibleOrders.length}</span> of <span className="font-bold tabular-nums text-artisan-text">{filteredOrders.length}</span> matching order{filteredOrders.length === 1 ? '' : 's'}
            </p>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="w-fit text-sm font-semibold text-artisan-primary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary">Clear search and filter</button>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] xl:items-start">
            <section
              aria-labelledby="order-management-heading"
              className={`rounded-2xl border p-4 transition-colors sm:p-5 ${selectedSelectableOrders.length > 0 ? 'border-artisan-primary/25 bg-artisan-primary-wash/55' : 'border-artisan-primary/10 bg-white/75'}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                    <ListChecks size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 id="order-management-heading" className="font-bold text-artisan-text">Manage eligible orders</h3>
                      <span className={`rounded-lg px-2 py-1 text-xs font-bold tabular-nums ${selectedSelectableOrders.length > 0 ? 'bg-artisan-primary text-white' : 'bg-white text-artisan-text-muted'}`} aria-live="polite">
                        {selectedSelectableOrders.length} selected
                      </span>
                    </div>
                    <p className="mt-1 max-w-xl text-sm leading-5 text-artisan-text-muted">
                      Completed, cancelled, and declined orders can be selected. Every delete action still requires confirmation.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <button
                    type="button"
                    onClick={toggleVisibleOrderSelection}
                    disabled={selectableVisibleOrders.length === 0}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-artisan-primary transition hover:text-artisan-primary-dark disabled:cursor-not-allowed disabled:text-artisan-text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary"
                  >
                    {areVisibleOrdersSelected
                      ? <CheckSquare size={18} aria-hidden="true" />
                      : <Square size={18} aria-hidden="true" />}
                    {areVisibleOrdersSelected
                      ? 'Deselect displayed'
                      : `Select eligible displayed (${selectableVisibleOrders.length})`}
                  </button>
                  {selectedSelectableOrders.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCurrentSelection}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-artisan-text-muted transition hover:text-artisan-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary"
                    >
                      <X size={15} aria-hidden="true" /> Clear selection
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 border-t border-artisan-primary/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-artisan-text-muted">
                  {selectedSelectableOrders.length > 0
                    ? `${selectedSelectableOrders.length} order${selectedSelectableOrders.length === 1 ? '' : 's'} ready for a bulk action.`
                    : selectableVisibleOrders.length > 0
                      ? 'Use the row checkboxes or select all eligible orders currently displayed.'
                      : 'No eligible orders are displayed in this result set.'}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  {!isRecycleBinView && (
                    <Button type="button" variant="outline" disabled={recyclableOrders.length === 0} onClick={() => openBulkRecycleDialog(recyclableOrders)}>
                      <ArchiveRestore className="mr-2" size={16} aria-hidden="true" />
                      Move all eligible to recycle bin ({recyclableOrders.length})
                    </Button>
                  )}
                  {selectedSelectableOrders.length > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => (
                        isRecycleBinView
                          ? openBulkPermanentDeleteDialog(selectedRecyclableArchivedOrders)
                          : openBulkPermanentDeleteDialog(selectedRecyclableOrders, 'active-orders')
                      )}
                    >
                      <Trash2 className="mr-2" size={16} aria-hidden="true" />
                      Permanently delete selected ({selectedSelectableOrders.length})
                    </Button>
                  )}
                </div>
              </div>
            </section>

            <details className="group overflow-hidden rounded-2xl border border-artisan-primary/10 bg-white/80 shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 transition hover:bg-artisan-primary-wash/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-artisan-primary sm:p-5">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-artisan-primary">
                    <FileSpreadsheet size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-artisan-text">Export orders</h3>
                    <p className="mt-1 text-sm leading-5 text-artisan-text-muted">Choose a date range or product, then download Excel.</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-lg bg-artisan-primary-wash px-2 py-1 text-xs font-bold tabular-nums text-artisan-primary">{exportOrderCount} orders</span>
                  <ChevronDown size={18} className="text-artisan-text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                </div>
              </summary>

              <div className="border-t border-artisan-primary/10 p-4 sm:p-5">
                <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-950">
                  <ShieldAlert size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold">Contains private customer information</p>
                    <p className="mt-1 text-xs leading-5">
                      The workbook includes customer names, email addresses, phone numbers, recipients, shipping addresses, and deletion-audit records. Share it only with authorized staff and store it securely.
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-5 text-artisan-text-muted">
                  Export filters are separate from the search and status filters above. Recycled orders remain included unless the export date or product filters exclude them.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">
                    From
                    <input type="date" value={exportStartDate} max={exportEndDate || undefined} disabled={isExporting} onChange={(event) => setExportStartDate(event.target.value)} className="h-11 rounded-xl border border-artisan-border bg-white px-3 text-sm normal-case tracking-normal text-artisan-text outline-none transition disabled:cursor-wait disabled:opacity-60 focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15" />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">
                    To
                    <input type="date" value={exportEndDate} min={exportStartDate || undefined} disabled={isExporting} onChange={(event) => setExportEndDate(event.target.value)} className="h-11 rounded-xl border border-artisan-border bg-white px-3 text-sm normal-case tracking-normal text-artisan-text outline-none transition disabled:cursor-wait disabled:opacity-60 focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15" />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-artisan-text-muted sm:col-span-2">
                    Product
                    <select value={exportProductId} disabled={isExporting} onChange={(event) => setExportProductId(event.target.value)} className="h-11 rounded-xl border border-artisan-border bg-white px-3 text-sm normal-case tracking-normal text-artisan-text outline-none transition disabled:cursor-wait disabled:opacity-60 focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15">
                      <option value="">All products</option>
                      {exportProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                    </select>
                  </label>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {hasExportFilters ? (
                    <button type="button" disabled={isExporting} onClick={clearExportFilters} className="w-fit text-sm font-semibold text-artisan-text-muted underline-offset-4 transition hover:text-artisan-text hover:underline disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary">
                      Clear export filters
                    </button>
                  ) : <span className="text-xs text-artisan-text-faint">All recorded orders are in scope.</span>}
                  <Button type="button" onClick={handleOrdersExport} disabled={isExporting} className="h-11 whitespace-nowrap">
                    {isExporting ? <LoaderCircle className="mr-2 animate-spin" size={16} aria-hidden="true" /> : <Download className="mr-2" size={16} aria-hidden="true" />}
                    {isExporting ? 'Preparing workbook…' : `Download ${exportOrderCount} order${exportOrderCount === 1 ? '' : 's'}`}
                  </Button>
                </div>

                {exportMessage && (
                  <div className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${exportStatus === 'error' ? 'border-red-200 bg-red-50 text-red-800' : exportStatus === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-artisan-primary/15 bg-artisan-primary-wash text-artisan-text'}`} role="status" aria-live="polite">
                    {exportStatus === 'error'
                      ? <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                      : exportStatus === 'success'
                        ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                        : <LoaderCircle size={17} className="mt-0.5 shrink-0 animate-spin" aria-hidden="true" />}
                    <p>{exportMessage}</p>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>

      <div>
        {visibleOrders.length > 0 && (
          <>
            <div className="hidden max-h-[46rem] overflow-auto md:block">
              <table className="artisan-data-table w-full min-w-[880px]">
                <caption className="sr-only">Orders matching the current search and status filter</caption>
                <thead className="sticky top-0 z-10 shadow-sm">
                  <tr>
                    {isAdmin && <th className="w-14 p-4 text-left text-sm font-bold"><input type="checkbox" checked={areVisibleOrdersSelected} disabled={selectableVisibleOrders.length === 0} onChange={toggleVisibleOrderSelection} aria-label={isRecycleBinView ? 'Select displayed eligible recycled orders' : 'Select displayed eligible active orders'} className="h-4 w-4 rounded border-artisan-primary/30 text-artisan-primary focus:ring-artisan-primary" /></th>}
                    <th className="p-4 text-left text-sm font-bold">Order</th>
                    <th className="p-4 text-left text-sm font-bold">Customer</th>
                    <th className="p-4 text-left text-sm font-bold">Items</th>
                    <th className="p-4 text-left text-sm font-bold">Total</th>
                    <th className="p-4 text-left text-sm font-bold">Status</th>
                    <th className="p-4 text-right text-sm font-bold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleOrders.map((order) => {
                    const canSelectOrder = isAdmin && ARCHIVABLE_ORDER_STATUSES.has(order.status) && ((orderView === 'active' && !order.archive?.isArchived) || (orderView === 'archived' && order.archive?.isArchived));
                    const totalItemQuantity = getTotalItemQuantity(order.items);
                    return (
                      <tr key={order.id} className="border-t border-artisan-primary/10 text-artisan-text transition-colors duration-200 hover:bg-artisan-primary-wash/30">
                        {isAdmin && <td className="p-4 align-top">{canSelectOrder && <input type="checkbox" checked={selectedIdsForCurrentView.includes(order.id)} onChange={() => toggleOrderSelection(order.id)} aria-label={`Select order #${order.id.slice(0, 8)}`} className="h-4 w-4 rounded border-artisan-primary/30 text-artisan-primary focus:ring-artisan-primary" />}</td>}
                        <td className="p-4 align-top"><p className="font-bold text-artisan-text">#{order.id.slice(0, 8)}</p><p className="mt-1 text-xs text-artisan-text-muted">{formatOrderDate(order.createdAt)}</p></td>
                        <td className="max-w-[15rem] p-4 align-top text-sm text-artisan-text-muted"><span className="break-all">{order.buyerEmail || 'Guest'}</span></td>
                        <td className="max-w-[18rem] p-4 align-top">
                          {order.items?.length ? <><ul className="space-y-1 text-sm text-artisan-text-muted">{order.items.slice(0, 2).map((item, index) => <li key={`${order.id}-${index}`} className="truncate">{item.name} <span className="text-artisan-text-faint">×{item.quantity}</span></li>)}</ul><p className="mt-1.5 text-xs font-medium text-artisan-text-faint">{totalItemQuantity} item{totalItemQuantity === 1 ? '' : 's'} total{order.items.length > 2 ? ` · +${order.items.length - 2} more type${order.items.length - 2 === 1 ? '' : 's'}` : ''}</p></> : <span className="text-sm text-artisan-text-faint">No items listed</span>}
                        </td>
                        <td className="p-4 align-top font-bold tabular-nums text-artisan-primary">{formatPrice(order.total || 0)}</td>
                        <td className="p-4 align-top"><div className="space-y-2">{getStatusBadge(order.status)}{hasOpenStatusCorrectionRequest(order) && <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-950"><AlertCircle size={13} aria-hidden="true" />Needs special attention</span>}</div></td>
                        <td className="p-4 text-right align-top"><OrderDetailsButton order={order} setSelectedOrder={setSelectedOrder} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="max-h-[46rem] space-y-3 overflow-y-auto bg-artisan-primary-wash/20 p-3 md:hidden">
              {visibleOrders.map((order) => {
                const canSelectOrder = isAdmin && ARCHIVABLE_ORDER_STATUSES.has(order.status) && ((orderView === 'active' && !order.archive?.isArchived) || (orderView === 'archived' && order.archive?.isArchived));
                const totalItemQuantity = getTotalItemQuantity(order.items);
                return (
                  <article key={order.id} className="rounded-2xl border border-artisan-primary/10 bg-white p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-artisan-primary/30 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="font-bold text-artisan-text">Order #{order.id.slice(0, 8)}</p><p className="mt-1 text-xs text-artisan-text-muted">{formatOrderDate(order.createdAt)}</p></div>
                      {canSelectOrder && <input type="checkbox" checked={selectedIdsForCurrentView.includes(order.id)} onChange={() => toggleOrderSelection(order.id)} aria-label={`Select order #${order.id.slice(0, 8)}`} className="mt-1 h-4 w-4 shrink-0 rounded border-artisan-primary/30 text-artisan-primary focus:ring-artisan-primary" />}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">{getStatusBadge(order.status)}{hasOpenStatusCorrectionRequest(order) && <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-950"><AlertCircle size={13} aria-hidden="true" />Needs special attention</span>}</div>
                    {hasOpenStatusCorrectionRequest(order) && <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium leading-5 text-amber-950">Sub-admin request: {order.statusCorrectionRequest.message}</p>}
                    <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 border-y border-artisan-primary/10 py-4">
                      <div className="min-w-0"><dt className="text-xs font-bold uppercase tracking-[0.12em] text-artisan-text-faint">Customer</dt><dd className="mt-1 break-all text-sm font-medium text-artisan-text">{order.buyerEmail || 'Guest'}</dd></div>
                      <div className="text-right"><dt className="text-xs font-bold uppercase tracking-[0.12em] text-artisan-text-faint">Total</dt><dd className="mt-1 font-bold tabular-nums text-artisan-primary">{formatPrice(order.total || 0)}</dd></div>
                      <div className="col-span-2"><dt className="text-xs font-bold uppercase tracking-[0.12em] text-artisan-text-faint">Items</dt><dd className="mt-1 text-sm text-artisan-text-muted">{order.items?.length ? `${order.items[0].name}${order.items.length > 1 ? ` and ${order.items.length - 1} more type${order.items.length - 1 === 1 ? '' : 's'}` : ''} · ${totalItemQuantity} item${totalItemQuantity === 1 ? '' : 's'} total` : 'No items listed'}</dd></div>
                    </dl>
                    <div className="mt-4 flex justify-end"><OrderDetailsButton order={order} setSelectedOrder={setSelectedOrder} /></div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {orders.length === 0 && <OrderEmptyState icon={<ShoppingCart size={48} aria-hidden="true" />} title="No orders yet" copy="New customer orders will appear here automatically." />}
        {orders.length > 0 && visibleOrders.length === 0 && <OrderEmptyState icon={<Search size={44} aria-hidden="true" />} title={emptyStateTitle} copy={emptyStateCopy} action={hasActiveFilters ? <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button> : null} />}

        {visibleOrders.length > 0 && (
          <div className="flex flex-col items-center gap-3 border-t border-artisan-primary/10 px-5 py-5 sm:flex-row sm:justify-between">
            <p className="text-sm tabular-nums text-artisan-text-muted">Displaying {visibleOrders.length} of {filteredOrders.length} matching order{filteredOrders.length === 1 ? '' : 's'}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {hasMore && <Button variant="outline" onClick={() => setVisibleCount((count) => count + 5)}>Load 5 more</Button>}
              {hasActiveFilters && <Button variant="ghost" onClick={clearFilters}>Clear filters</Button>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const OrderSummary = ({ label, value, tone = 'default' }) => {
  const toneClass = tone === 'attention'
    ? 'border-amber-200 bg-amber-50/90 text-amber-900'
    : tone === 'primary'
      ? 'border-artisan-primary/20 bg-artisan-primary text-white'
      : 'border-artisan-primary/10 bg-white/90 text-artisan-text';

  return (
    <div className={`rounded-xl border px-3 py-3 shadow-sm ${toneClass}`}>
      <dt className={`text-[0.68rem] font-bold uppercase tracking-[0.1em] ${tone === 'primary' ? 'text-white/75' : 'text-current opacity-65'}`}>{label}</dt>
      <dd className="mt-1 text-xl font-bold tabular-nums">{value}</dd>
    </div>
  );
};

const OrderDetailsButton = ({ order, setSelectedOrder }) => (
  <Button type="button" size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
    <Eye className="mr-2" size={14} aria-hidden="true" /> Open
  </Button>
);

const OrderEmptyState = ({ icon, title, copy, action = null }) => (
  <div className="px-6 py-16 text-center text-artisan-text-muted">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-artisan-primary-wash text-artisan-primary-pale">{icon}</div>
    <p className="text-lg font-semibold text-artisan-text">{title}</p>
    <p className="mx-auto mt-1 max-w-md text-sm leading-6">{copy}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default AdminOrdersTab;
