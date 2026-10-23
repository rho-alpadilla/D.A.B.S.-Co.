import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Download,
  DollarSign,
  FileText,
  Lightbulb,
  Package,
  ShoppingCart,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadAnalyticsWordReport } from '@/lib/exports/adminExports';
import { getAnalyticsTodayKey } from '@/lib/analytics/descriptiveAnalytics';

const ANALYTICS_DATE_PRESETS = [
  { id: 'all', label: 'All time', days: null },
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last 90 days', days: 90 },
];

const FORECAST_HORIZON_OPTIONS = [7, 30, 60, 90];

const getPresetRange = (days, today = new Date()) => {
  if (!days) return { start: '', end: '' };

  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - (days - 1));

  return {
    start: getAnalyticsTodayKey(start),
    end: getAnalyticsTodayKey(today),
  };
};

const formatScopeDate = (dateValue) => {
  if (!dateValue) return '';

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateValue}T00:00:00`));
};

const getScopeLabel = ({ startDate, endDate }) => {
  if (startDate && endDate) return `${formatScopeDate(startDate)} – ${formatScopeDate(endDate)}`;
  if (startDate) return `${formatScopeDate(startDate)} through today`;
  if (endDate) return `Through ${formatScopeDate(endDate)}`;
  return 'All recorded orders';
};

const getCurrencyChartOptions = (formatPrice) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => ` ${formatPrice(context.parsed.y || 0)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(92, 45, 145, 0.08)' },
      ticks: { callback: (value) => formatPrice(value) },
    },
  },
});

const EmptyChartState = ({ action, icon: Icon, title, detail }) => (
  <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-artisan-primary/20 bg-artisan-primary-wash/25 px-6 text-center">
    <Icon size={30} className="mb-3 text-artisan-primary-pale" aria-hidden="true" />
    <p className="font-semibold text-artisan-text">{title}</p>
    <p className="mt-1 text-sm text-artisan-text-muted">{detail}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const ProductList = ({ products, formatPrice, type }) => {
  if (!products.length) {
    return <p className="py-8 text-center text-artisan-text-muted">No completed product sales in this range.</p>;
  }

  return (
    <div className="max-h-[300px] space-y-3 overflow-y-auto pr-1">
      {products.map((product, index) => (
        <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/35 p-3 text-sm">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {type === 'top' && <span className="w-6 shrink-0 text-lg font-bold text-artisan-primary-pale">#{index + 1}</span>}
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-artisan-primary-wash">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-artisan-text-faint">No image</div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-artisan-text">{product.name}</p>
              <p className="text-xs text-artisan-text-muted">
                {product.totalSold} sold · Stock: {product.stockQuantity}
              </p>
            </div>
          </div>
          <p className="shrink-0 whitespace-nowrap text-base font-bold text-artisan-primary">{formatPrice(product.revenue)}</p>
        </div>
      ))}
    </div>
  );
};

const AdminAnalyticsTab = ({
  customEndDate,
  customStartDate,
  handleDeleteDataQualityOrder,
  handleReviewDataQualityOrder,
  descriptiveAnalytics,
  diagnosticAnalytics,
  formatPrice,
  forecast,
  isAdmin,
  isSubAdmin,
  prescriptiveRecommendations,
  rangeDays,
  revenueChartData,
  revenueOverTimeData,
  setCustomEndDate,
  setCustomStartDate,
  setRangeDays,
  user,
}) => {
  const [exportMessage, setExportMessage] = useState('');
  const [exportStatus, setExportStatus] = useState('idle');
  const [isExporting, setIsExporting] = useState(false);

  const handleAnalyticsExport = async () => {
    if (!isAdmin) {
      setExportMessage('Only the main admin can export analytics.');
      setExportStatus('error');
      return;
    }

    setIsExporting(true);
    setExportStatus('working');
    setExportMessage('Preparing the Word report. Keep this page open.');
    try {
      await downloadAnalyticsWordReport({
        customEndDate,
        customStartDate,
        descriptiveAnalytics,
        diagnosticAnalytics,
        forecast,
        prescriptiveRecommendations,
      });
      setExportMessage('Downloaded a local Word analytics report. Shipping addresses and customer contact details are excluded.');
      setExportStatus('success');
    } catch (error) {
      console.error('Unable to export analytics', error);
      setExportMessage('The report could not be created. Please try again.');
      setExportStatus('error');
    } finally {
      setIsExporting(false);
    }
  };

  if (isSubAdmin || !isAdmin) {
    return (
      <div className="rounded-[2rem] border border-red-100 bg-white/95 p-10 text-center shadow-xl shadow-[#2D0E5A]/10">
        <AlertCircle size={56} className="mx-auto mb-4 text-red-500" />
        <h2 className="font-nunito text-2xl font-bold text-red-600">Permission Blocked</h2>
        <p className="mt-3 text-base text-artisan-text-muted">Contact the main admin for analytics.</p>
      </div>
    );
  }

  const {
    averageOrderValue,
    bestSellerUnits,
    completedOrderCount,
    dataQuality,
    dateRange,
    dailyRevenue,
    leastSoldProducts,
    statusBreakdown,
    topProducts,
    totalRevenue,
  } = descriptiveAnalytics;
  const hasRevenueOverTimeData = dailyRevenue.some((entry) => entry.revenue > 0);
  const hasProductRevenueData = topProducts.some((product) => product.revenue > 0);
  const qualityIssueCount = dataQuality.affectedOrderCount || 0;
  const today = new Date();
  const todayKey = getAnalyticsTodayKey(today);
  const presetRanges = ANALYTICS_DATE_PRESETS.map((preset) => ({
    ...preset,
    ...getPresetRange(preset.days, today),
  }));
  const activePresetId = presetRanges.find((preset) => (
    preset.start === customStartDate && preset.end === customEndDate
  ))?.id || 'custom';
  const scopeLabel = getScopeLabel({ startDate: customStartDate, endDate: customEndDate });
  const maxStartDate = customEndDate && customEndDate < todayKey ? customEndDate : todayKey;
  const minEndDate = customStartDate && customStartDate <= todayKey ? customStartDate : undefined;
  const scopeOrderCount = descriptiveAnalytics.scopedOrders.length;
  const completionRate = scopeOrderCount ? Math.round((completedOrderCount / scopeOrderCount) * 100) : 0;
  const bestSellerName = topProducts[0]?.name || 'No completed product sales';
  const excludedUndatedCompletedOrders = dateRange.excludedUndatedCompletedOrders || 0;
  const currencyChartOptions = getCurrencyChartOptions(formatPrice);
  const formattedRevenueOverTimeData = {
    ...revenueOverTimeData,
    labels: dailyRevenue.map((entry) => new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(`${entry.key}T00:00:00`))),
  };
  const diagnosticSummary = diagnosticAnalytics.isAvailable
    ? getDiagnosticSummary(diagnosticAnalytics, formatPrice)
    : null;
  const forecastTrend = forecast.isAvailable
    ? getForecastTrendPresentation(forecast.trendDirection, forecast.trendPercent)
    : null;
  const thirtyDayPreset = presetRanges.find((preset) => preset.id === '30');
  const ninetyDayPreset = presetRanges.find((preset) => preset.id === '90');

  const applyDatePreset = (preset) => {
    setCustomStartDate(preset.start);
    setCustomEndDate(preset.end);
    setExportMessage('');
    setExportStatus('idle');
  };

  const updateStartDate = (nextStartDate) => {
    setCustomStartDate(nextStartDate);
    if (customEndDate && nextStartDate && nextStartDate > customEndDate) {
      setCustomEndDate(nextStartDate);
    }
    setExportMessage('');
    setExportStatus('idle');
  };

  const updateEndDate = (nextEndDate) => {
    setCustomEndDate(nextEndDate);
    if (customStartDate && nextEndDate && nextEndDate < customStartDate) {
      setCustomStartDate(nextEndDate);
    }
    setExportMessage('');
    setExportStatus('idle');
  };

  const updateForecastHorizon = (horizonDays) => {
    setRangeDays(horizonDays);
    setExportMessage('');
    setExportStatus('idle');
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="order-0 overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/95 shadow-xl shadow-[#2D0E5A]/10" aria-labelledby="analytics-overview-heading">
        <div className="grid gap-5 bg-[radial-gradient(circle_at_top_right,rgba(118,72,179,0.14),transparent_38%),linear-gradient(180deg,rgba(248,245,252,0.98),rgba(255,255,255,0.98))] p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.62fr)] lg:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Analytics report</p>
            <h2 id="analytics-overview-heading" className="mt-2 font-nunito text-3xl font-bold tracking-tight text-artisan-text sm:text-4xl">Sales overview</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-artisan-text-muted sm:text-base">
              Review completed sales and order activity for a clearly defined date range.
            </p>
          </div>

          <div className="rounded-2xl border border-artisan-primary/15 bg-artisan-primary p-4 text-white shadow-lg shadow-artisan-primary/15">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/65">Current scope</p>
            <p className="mt-1 text-lg font-bold">{scopeLabel}</p>
            <p className="mt-2 text-sm text-white/75">
              {scopeOrderCount} order{scopeOrderCount === 1 ? '' : 's'} recorded · {completedOrderCount} completed
            </p>
          </div>
        </div>

        <div className="border-t border-artisan-primary/10 p-5 sm:p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-sm font-bold text-artisan-text">Choose a reporting period</p>
              <p className="mt-1 text-sm text-artisan-text-muted">Preset ranges include today and use Philippine local calendar dates.</p>
            </div>
            <div className="inline-flex w-full flex-wrap gap-1 rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/45 p-1 sm:w-auto" role="group" aria-label="Analytics date range presets">
              {presetRanges.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={activePresetId === preset.id}
                  onClick={() => applyDatePreset(preset)}
                  className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary sm:flex-none ${activePresetId === preset.id ? 'bg-artisan-primary text-white shadow-sm' : 'text-artisan-text-muted hover:bg-white hover:text-artisan-text'}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">
              Custom start
              <input type="date" value={customStartDate} onChange={(event) => updateStartDate(event.target.value)} max={maxStartDate} className="h-11 w-full rounded-xl border border-artisan-border bg-white px-4 text-sm normal-case tracking-normal text-artisan-text outline-none transition-[border-color,box-shadow] duration-200 focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15" />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">
              Custom end
              <input type="date" value={customEndDate} onChange={(event) => updateEndDate(event.target.value)} min={minEndDate} max={todayKey} className="h-11 w-full rounded-xl border border-artisan-border bg-white px-4 text-sm normal-case tracking-normal text-artisan-text outline-none transition-[border-color,box-shadow] duration-200 focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15" />
            </label>
            <Button type="button" onClick={handleAnalyticsExport} className="h-11 w-full whitespace-nowrap xl:w-auto" disabled={isExporting}>
              {isExporting ? <FileText className="mr-2 animate-pulse" size={16} aria-hidden="true" /> : <Download className="mr-2" size={16} aria-hidden="true" />}
              {isExporting ? 'Preparing report…' : 'Download Word report'}
            </Button>
          </div>

          {activePresetId === 'custom' && (
            <p className="mt-3 text-xs font-medium text-artisan-primary">Custom date range active: {scopeLabel}</p>
          )}

          {excludedUndatedCompletedOrders > 0 && (
            <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950" role="status">
              <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{excludedUndatedCompletedOrders} completed order{excludedUndatedCompletedOrders === 1 ? '' : 's'} without a valid order date cannot be assigned to this custom range and {excludedUndatedCompletedOrders === 1 ? 'is' : 'are'} excluded.</p>
            </div>
          )}

          {exportMessage && (
            <div className={`mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${exportStatus === 'error' ? 'border-red-200 bg-red-50 text-red-800' : exportStatus === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-artisan-primary/15 bg-artisan-primary-wash text-artisan-text'}`} role="status" aria-live="polite">
              {exportStatus === 'error'
                ? <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                : exportStatus === 'success'
                  ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
                  : <FileText size={17} className="mt-0.5 shrink-0 animate-pulse" aria-hidden="true" />}
              <p>{exportMessage}</p>
            </div>
          )}
        </div>
      </section>

      <div className="order-1 pt-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Descriptive analytics</p>
        <h3 className="mt-1 font-nunito text-2xl font-bold text-artisan-text">What happened</h3>
        <p className="mt-1 text-sm text-artisan-text-muted">Completed-sales totals and all-status order activity. Selected scope: {scopeLabel}.</p>
      </div>

      {qualityIssueCount > 0 && (
        <div className="order-1 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <p>
            {dataQuality.affectedOrderCount} completed order{dataQuality.affectedOrderCount === 1 ? '' : 's'} need analytics data review.
            {dataQuality.completedOrdersMissingDate > 0 && `${dataQuality.completedOrdersMissingDate} missing a valid date. `}
            {dataQuality.ordersMissingTotal > 0 && `${dataQuality.ordersMissingTotal} missing a valid total. `}
            {dataQuality.ordersMissingItems > 0 && `${dataQuality.ordersMissingItems} missing usable item details. `}
            Affected records are excluded only where that information is required.
          </p>
        </div>
      )}

      {qualityIssueCount > 0 && (
        <section className="order-1 rounded-[1.5rem] border border-amber-200 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="font-nunito text-2xl font-bold text-artisan-text">Data quality queue</h3>
              <p className="mt-1 text-sm text-artisan-text-muted">Review an affected historical order before relying on its detailed analytics. Permanent deletion is only for reviewed incomplete records and requires a reason plus typed confirmation.</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-amber-800">Showing up to 10 affected orders</span>
          </div>
          <div className="mt-4 max-h-72 divide-y divide-artisan-primary/10 overflow-y-auto rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/20">
            {dataQuality.records.slice(0, 10).map((record) => (
              <div key={record.orderId} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-artisan-text">#{record.orderId.slice(0, 8)}</p>
                  <p className="truncate text-sm text-artisan-text-muted">{record.buyerEmail}</p>
                  {record.reviewedBy === user?.uid && (
                    <p className="mt-1 text-xs font-semibold text-emerald-700">Reviewed by you — deletion confirmation available</p>
                  )}
                  {record.reviewedBy && record.reviewedBy !== user?.uid && (
                    <p className="mt-1 text-xs font-semibold text-artisan-text-muted">Reviewed by another main admin</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  {record.issues.map((issue) => (
                    <span key={issue.code} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">{issue.label}</span>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => handleReviewDataQualityOrder(record.orderId)}>
                    Review order
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDataQualityOrder(record.orderId)}
                    disabled={record.reviewedBy !== user?.uid}
                    className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    title={record.reviewedBy === user?.uid ? 'Permanently delete this reviewed incomplete order' : 'Review this order first to unlock deletion'}
                  >
                    <Trash2 size={15} className="mr-1.5" />
                    Delete record
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="order-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.18fr_repeat(3,minmax(0,1fr))]" aria-label="Completed sales summary">
        <MetricCard
          icon={DollarSign}
          label="Completed revenue"
          value={formatPrice(totalRevenue)}
          detail="Sum of totals from completed orders"
          featured
        />
        <MetricCard
          icon={ShoppingCart}
          label="Completed orders"
          value={completedOrderCount}
          detail={`${completionRate}% of all ${scopeOrderCount} orders in scope`}
        />
        <MetricCard
          icon={TrendingUp}
          label="Average completed order"
          value={formatPrice(averageOrderValue)}
          detail="Completed revenue divided by completed orders"
        />
        <MetricCard
          icon={Award}
          label="Top product units"
          value={bestSellerUnits}
          detail={bestSellerName}
        />
      </section>

      <section className="order-2 rounded-[1.5rem] border border-artisan-primary/15 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10 sm:p-6" aria-labelledby="diagnostic-analytics-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Diagnostic analytics</p>
            <h3 id="diagnostic-analytics-heading" className="mt-1 flex items-center gap-2 font-nunito text-2xl font-bold text-artisan-text"><BarChart3 className="text-artisan-primary" size={24} aria-hidden="true" /> Why might it have changed?</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-artisan-text-muted">This compares equal-length periods using recorded orders. It identifies possible contributors, not proof of cause.</p>
          </div>
          {diagnosticAnalytics.isAvailable && (
            <div className="shrink-0 rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/50 px-3 py-2 text-xs leading-5 text-artisan-text-muted">
              <span className="block font-semibold text-artisan-text">Current {diagnosticAnalytics.periodDays}-day period</span>
              <span>{formatComparisonDateRange(diagnosticAnalytics.currentRange)} vs {formatComparisonDateRange(diagnosticAnalytics.previousRange)}</span>
            </div>
          )}
        </div>

        {!diagnosticAnalytics.isAvailable ? (
          <div className="mt-5 h-44">
            <EmptyChartState
              icon={CalendarRange}
              title="Comparison needs a complete period"
              detail={diagnosticAnalytics.reason}
              action={<Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset(thirtyDayPreset)}>Compare the last 30 days</Button>}
            />
          </div>
        ) : (
          <>
            <div className={`mt-5 rounded-2xl border p-4 sm:p-5 ${diagnosticSummary.containerClassName}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.14em] ${diagnosticSummary.labelClassName}`}>Period result</p>
                  <h4 className="mt-1 text-xl font-bold text-artisan-text sm:text-2xl">{diagnosticSummary.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-artisan-text-muted">{diagnosticSummary.detail}</p>
                </div>
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${diagnosticSummary.iconClassName}`}>
                  <diagnosticSummary.Icon size={23} aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DiagnosticMetricCard label="Completed revenue" metric={diagnosticAnalytics.metrics.revenue} value={formatPrice(diagnosticAnalytics.metrics.revenue.current)} previousValue={formatPrice(diagnosticAnalytics.metrics.revenue.previous)} higherIsBetter />
              <DiagnosticMetricCard label="Completed orders" metric={diagnosticAnalytics.metrics.orderCount} value={diagnosticAnalytics.metrics.orderCount.current} previousValue={diagnosticAnalytics.metrics.orderCount.previous} higherIsBetter />
              <DiagnosticMetricCard label="Average order value" metric={diagnosticAnalytics.metrics.averageOrderValue} value={formatPrice(diagnosticAnalytics.metrics.averageOrderValue.current)} previousValue={formatPrice(diagnosticAnalytics.metrics.averageOrderValue.previous)} higherIsBetter />
              <DiagnosticMetricCard label="Order exceptions" metric={diagnosticAnalytics.metrics.exceptions} value={diagnosticAnalytics.metrics.exceptions.current} previousValue={diagnosticAnalytics.metrics.exceptions.previous} higherIsBetter={false} />
            </div>

            <div className="mt-5 rounded-2xl bg-artisan-primary-wash/30 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-artisan-primary shadow-sm"><Activity size={18} aria-hidden="true" /></span>
                <div>
                  <h4 className="font-nunito font-semibold text-artisan-text">Observed contributors</h4>
                  <p className="mt-1 text-sm leading-6 text-artisan-text-muted">These are changes recorded in the two periods. Confirm product availability, campaigns, and customer feedback before treating any signal as a cause.</p>
                </div>
              </div>
              {diagnosticAnalytics.contributors.length ? (
                <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {diagnosticAnalytics.contributors.map((contributor, index) => (
                    <li key={contributor.id} className="flex gap-3 rounded-xl bg-white/90 p-4 text-sm shadow-sm shadow-[#2D0E5A]/5">
                      <span className="font-mono text-xs font-bold text-artisan-primary-pale">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="font-semibold text-artisan-text">{getContributorLabel(contributor)}</p>
                        <p className={`mt-1 font-bold tabular-nums ${contributor.change > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatContributorChange(contributor, formatPrice)}</p>
                        <p className="mt-2 leading-5 text-artisan-text-muted">{contributor.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-xl bg-white/80 px-4 py-3 text-sm text-artisan-text-muted">No material changes were detected between these two periods.</p>
              )}
            </div>
          </>
        )}
      </section>

      <section className="order-1 rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-nunito text-2xl font-bold text-artisan-text">Revenue over time</h3>
            <p className="mt-1 text-sm text-artisan-text-muted">Completed-order revenue per calendar day.</p>
          </div>
        </div>
        <div className="h-56 sm:h-64">
          {hasRevenueOverTimeData ? (
            <Line data={formattedRevenueOverTimeData} options={currencyChartOptions} />
          ) : (
            <EmptyChartState icon={TrendingUp} title="No completed revenue in this range" detail="Choose a range that includes completed orders." />
          )}
        </div>
      </section>

      <section className="order-1 grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
          <h3 className="flex items-center gap-2 font-nunito text-2xl font-bold text-artisan-text"><BarChart3 className="text-artisan-primary" size={24} /> Order status mix</h3>
          <p className="mt-1 text-sm text-artisan-text-muted">All order statuses in the selected date scope.</p>
          <div className="mt-5 max-h-[18.75rem] space-y-3 overflow-y-auto pr-1">
            {statusBreakdown.length ? statusBreakdown.map((status) => (
              <div key={status.label} className="flex items-center justify-between rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/35 px-4 py-3">
                <span className="font-medium text-artisan-text">{status.label}</span>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-artisan-primary">{status.count}</span>
              </div>
            )) : <p className="py-8 text-center text-artisan-text-muted">No orders in this range.</p>}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
          <h3 className="flex items-center gap-2 font-nunito text-2xl font-bold text-artisan-text"><Package className="text-artisan-primary" size={24} /> Report scope</h3>
          <dl className="mt-5 space-y-4 text-sm">
            <ScopeRow label="All orders in scope" value={scopeOrderCount} />
            <ScopeRow label="Completed orders" value={completedOrderCount} />
            <ScopeRow label="Completion rate" value={`${completionRate}%`} />
            <ScopeRow label="Products represented" value={descriptiveAnalytics.productStats.length} />
            <ScopeRow label="Daily revenue points" value={dailyRevenue.length} />
          </dl>
          <p className="mt-5 rounded-xl bg-artisan-primary-wash/50 p-3 text-xs leading-5 text-artisan-text-muted">Completed revenue excludes pending, declined, cancelled, and refunded orders. Product rankings use completed-order item lines only, so product-line revenue can differ from order totals that include delivery or other adjustments.</p>
        </div>
      </section>

      <section className="order-1 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
          <h3 className="mb-1 flex items-center gap-2 font-nunito text-2xl font-bold text-artisan-text"><Award className="text-artisan-primary" size={24} /> Top sellers</h3>
          <p className="mb-4 text-sm text-artisan-text-muted">Ranked by units in completed-order item lines.</p>
          <ProductList products={topProducts} formatPrice={formatPrice} type="top" />
        </div>
        <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
          <h3 className="mb-1 font-nunito text-2xl font-bold text-artisan-text">Least sold catalog products</h3>
          <p className="mb-4 text-sm text-artisan-text-muted">Includes catalog products with no completed sales in this range.</p>
          <ProductList products={leastSoldProducts} formatPrice={formatPrice} type="least" />
        </div>
      </section>

      <section className="order-1 rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
        <h3 className="font-nunito text-2xl font-bold text-artisan-text">Product-line revenue</h3>
        <p className="mb-4 mt-1 text-sm text-artisan-text-muted">Item price × quantity from completed orders; this may not equal full order revenue.</p>
        <div className="h-56 sm:h-64">
          {hasProductRevenueData ? (
            <Bar data={revenueChartData} options={currencyChartOptions} />
          ) : (
            <EmptyChartState icon={Award} title="No product revenue to compare" detail="This chart populates after completed product sales." />
          )}
        </div>
      </section>

      <section className="order-3 rounded-[1.5rem] border border-artisan-primary/20 bg-artisan-primary-wash/45 p-5 text-artisan-text shadow-lg shadow-[#2D0E5A]/10 sm:p-6" aria-labelledby="predictive-analytics-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Predictive analytics</p>
            <h3 id="predictive-analytics-heading" className="mt-1 flex items-center gap-2 font-nunito text-2xl font-bold"><Target className="text-artisan-primary" size={24} aria-hidden="true" /> What might happen next?</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-artisan-text-muted">A no-cost, on-device projection based on completed-order revenue only. It is a planning estimate, not a guarantee or an automated decision.</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <div className="inline-flex rounded-xl border border-artisan-primary/15 bg-white/75 p-1" role="group" aria-label="Forecast horizon">
              {FORECAST_HORIZON_OPTIONS.map((horizonDays) => (
                <button
                  key={horizonDays}
                  type="button"
                  aria-pressed={rangeDays === horizonDays}
                  onClick={() => updateForecastHorizon(horizonDays)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary ${rangeDays === horizonDays ? 'bg-artisan-primary text-white shadow-sm' : 'text-artisan-text-muted hover:bg-artisan-primary-wash hover:text-artisan-text'}`}
                >
                  {horizonDays}d
                </button>
              ))}
            </div>
            {forecast.isAvailable && (
              <div className="rounded-xl border border-artisan-primary/15 bg-white/80 px-3 py-2 text-xs leading-5 text-artisan-text-muted">
                <span className="block font-semibold text-artisan-text">Forecast dates</span>
                <span>{formatComparisonDateRange(forecast.forecastRange)}</span>
              </div>
            )}
          </div>
        </div>

        {!forecast.isAvailable ? (
          <div className="mt-5 min-h-52">
            <EmptyChartState
              icon={TrendingUp}
              title="Forecast not ready"
              detail={forecast.reason}
              action={(
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs font-semibold text-artisan-text-muted">Current readiness: {forecast.activeDays || 0} revenue days across {forecast.historyDays || 0} calendar days.</p>
                  {activePresetId !== '90' && (
                    <Button type="button" variant="outline" size="sm" onClick={() => applyDatePreset(ninetyDayPreset)}>Check the last 90 days</Button>
                  )}
                </div>
              )}
            />
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ForecastMetricCard label={`${forecast.horizonDays}-day revenue estimate`} value={formatPrice(forecast.projectedRevenue)} detail={`${formatComparisonDateRange(forecast.forecastRange)}`} featured />
              <ForecastMetricCard label="Estimated daily average" value={formatPrice(forecast.projectedDailyAverage)} detail={`Historical average: ${formatPrice(forecast.averageDailyRevenue)} per day`} />
              <ForecastMetricCard label="Trend signal" value={forecastTrend.label} detail={forecastTrend.detail} valueClassName={forecastTrend.valueClassName} />
              <ForecastMetricCard label="Confidence guidance" value={forecast.confidence.level} detail={forecast.confidence.detail} valueClassName={getConfidenceTone(forecast.confidence.level)} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-artisan-primary/10 bg-white/75 p-4 lg:grid-cols-[0.8fr_0.65fr_1.35fr]">
              <div>
                <p className="text-sm font-semibold text-artisan-text">Scenario band</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-artisan-primary">{formatPrice(forecast.scenarioRange.low)} – {formatPrice(forecast.scenarioRange.high)}</p>
                <p className="mt-1 text-xs leading-5 text-artisan-text-muted">A planning range based on the average historical daily forecasting error. It is not a statistical confidence interval.</p>
              </div>
              <div className="border-t border-artisan-primary/10 pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                <p className="text-sm font-semibold text-artisan-text">Revenue-day coverage</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-artisan-text">{forecast.coveragePercent}%</p>
                <p className="mt-1 text-xs leading-5 text-artisan-text-muted">{forecast.activeDays} of {forecast.historyDays} calendar days recorded completed revenue.</p>
              </div>
              <div className="border-t border-artisan-primary/10 pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                <p className="text-sm font-semibold text-artisan-text">Method and limits</p>
                <p className="mt-1 text-sm leading-6 text-artisan-text-muted">{forecast.method} The estimate uses {forecast.activeDays} completed-revenue days within {forecast.historyDays} calendar days.</p>
              </div>
            </div>
          </>
        )}

        <div className="mt-6 border-t border-artisan-primary/15 pt-5" aria-labelledby="prescriptive-analytics-heading">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Prescriptive analytics</p>
          <h4 id="prescriptive-analytics-heading" className="mt-1 flex items-center gap-2 font-nunito text-xl font-bold"><Lightbulb size={21} className="text-artisan-primary" aria-hidden="true" /> What should we do next?</h4>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-artisan-text-muted">Suggested actions require admin judgement. They explain the evidence used, and nothing is automatically changed by this panel.</p>
          <ol className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
            {prescriptiveRecommendations.map((recommendation, index) => {
              const recommendationStyles = getRecommendationStyles(recommendation.priority);
              return (
              <li key={recommendation.id} className="flex gap-4 rounded-xl border border-white/80 bg-white/90 p-4 shadow-sm shadow-[#2D0E5A]/5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-artisan-primary text-sm font-bold text-white">{index + 1}</span>
                <div className="min-w-0">
                  <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold uppercase tracking-wide ${recommendationStyles}`}>{recommendation.priority}</span>
                  <p className="mt-3 font-semibold text-artisan-text">{recommendation.title}</p>
                  <p className="mt-2 text-sm leading-6 text-artisan-text-muted">{recommendation.description}</p>
                  {recommendation.evidence && (
                    <div className="mt-3 flex gap-2 rounded-lg bg-artisan-primary-wash/55 px-3 py-2 text-xs leading-5 text-artisan-text-muted">
                      <Activity size={15} className="mt-0.5 shrink-0 text-artisan-primary" aria-hidden="true" />
                      <p><span className="font-semibold text-artisan-text">Evidence:</span> {recommendation.evidence}</p>
                    </div>
                  )}
                </div>
              </li>
              );
            })}
          </ol>
        </div>
      </section>
    </div>
  );
};

const formatComparisonDate = (dateValue) => {
  if (!dateValue) return 'Unknown date';

  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${dateValue}T00:00:00`));
};

const formatComparisonDateRange = ({ startDate, endDate }) => (
  `${formatComparisonDate(startDate)} – ${formatComparisonDate(endDate)}`
);

const getDiagnosticSummary = (diagnosticAnalytics, formatPrice) => {
  const revenueMetric = diagnosticAnalytics.metrics.revenue;
  const absoluteChange = formatPrice(Math.abs(revenueMetric.change));
  const comparisonDetail = `${formatPrice(revenueMetric.current)} in the current period versus ${formatPrice(revenueMetric.previous)} in the previous period.`;

  if (revenueMetric.change > 0) {
    return {
      title: `Completed revenue increased by ${absoluteChange}`,
      detail: comparisonDetail,
      Icon: ArrowUpRight,
      containerClassName: 'border-emerald-200 bg-emerald-50/70',
      labelClassName: 'text-emerald-700',
      iconClassName: 'bg-emerald-100 text-emerald-700',
    };
  }

  if (revenueMetric.change < 0) {
    return {
      title: `Completed revenue decreased by ${absoluteChange}`,
      detail: comparisonDetail,
      Icon: ArrowDownRight,
      containerClassName: 'border-rose-200 bg-rose-50/70',
      labelClassName: 'text-rose-700',
      iconClassName: 'bg-rose-100 text-rose-700',
    };
  }

  return {
    title: 'Completed revenue held steady',
    detail: comparisonDetail,
    Icon: Activity,
    containerClassName: 'border-artisan-primary/10 bg-artisan-primary-wash/35',
    labelClassName: 'text-artisan-primary',
    iconClassName: 'bg-white text-artisan-primary',
  };
};

const getChangeLabel = (metric) => {
  if (metric.change === 0) return 'No change';
  if (metric.isNew) return 'New in this period';

  const prefix = metric.percentage > 0 ? '+' : '';
  return `${prefix}${Math.round(metric.percentage)}% vs previous`;
};

const getContributorLabel = (contributor) => {
  if (contributor.type === 'product') return contributor.title;
  if (contributor.type === 'orders') return 'Completed orders';
  if (contributor.type === 'aov') return 'Average order value';
  return 'Order exceptions';
};

const formatContributorChange = (contributor, formatPrice) => {
  const prefix = contributor.change > 0 ? '+' : '-';
  const absoluteChange = Math.abs(contributor.change);

  if (contributor.type === 'product') return `${prefix}${formatPrice(absoluteChange)} revenue`;
  if (contributor.type === 'aov') return `${prefix}${formatPrice(absoluteChange)} AOV`;
  return `${prefix}${absoluteChange} ${contributor.type === 'orders' ? 'completed order' : 'exception'}${absoluteChange === 1 ? '' : 's'}`;
};

const getForecastTrendPresentation = (trendDirection, trendPercent) => {
  const roundedTrendPercent = Math.abs(Math.round(trendPercent));

  if (trendDirection === 'upward') {
    return {
      label: `Upward +${roundedTrendPercent}%`,
      detail: 'Projected daily average compared with the historical daily average.',
      valueClassName: 'text-emerald-700',
    };
  }

  if (trendDirection === 'downward') {
    return {
      label: `Downward −${roundedTrendPercent}%`,
      detail: 'Projected daily average compared with the historical daily average.',
      valueClassName: 'text-rose-700',
    };
  }

  return {
    label: `Stable ${roundedTrendPercent}%`,
    detail: 'Projected daily average remains close to the historical daily average.',
    valueClassName: 'text-artisan-primary',
  };
};

const getRecommendationStyles = (priority) => ({
  Foundation: 'bg-sky-50 text-sky-700',
  Plan: 'bg-emerald-50 text-emerald-700',
  Review: 'bg-amber-50 text-amber-800',
  Caution: 'bg-rose-50 text-rose-700',
  Monitor: 'bg-artisan-primary-wash text-artisan-primary',
}[priority] || 'bg-artisan-primary-wash text-artisan-primary');

const DiagnosticMetricCard = ({ higherIsBetter, label, metric, previousValue, value }) => {
  const changed = metric.change !== 0;
  const isPositive = higherIsBetter ? metric.change > 0 : metric.change < 0;
  const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
  const changeTone = !changed
    ? 'text-artisan-text-muted bg-artisan-primary-wash/45'
    : isPositive
      ? 'text-emerald-700 bg-emerald-50'
      : 'text-rose-700 bg-rose-50';

  return (
    <article className="rounded-2xl border border-artisan-primary/10 bg-white p-4 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-semibold text-artisan-text-muted">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold tabular-nums text-artisan-text">{value}</p>
      <p className="mt-1 text-xs text-artisan-text-muted">Previous: {previousValue}</p>
      <p className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${changeTone}`}>
        {changed && <Icon size={14} aria-hidden="true" />}
        {getChangeLabel(metric)}
      </p>
    </article>
  );
};

const getConfidenceTone = (level) => ({
  moderate: 'text-emerald-700',
  limited: 'text-amber-700',
  low: 'text-rose-700',
}[level] || 'text-artisan-text');

const ForecastMetricCard = ({ detail, featured = false, label, value, valueClassName = 'text-artisan-text' }) => (
  <article className={`rounded-2xl border p-4 ${featured ? 'border-artisan-primary bg-artisan-primary text-white shadow-lg shadow-artisan-primary/15' : 'border-artisan-primary/10 bg-white/85'}`}>
    <p className={`text-sm font-semibold ${featured ? 'text-white/70' : 'text-artisan-text-muted'}`}>{label}</p>
    <p className={`mt-2 break-words text-2xl font-bold capitalize tabular-nums ${featured ? 'text-white' : valueClassName}`}>{value}</p>
    <p className={`mt-2 text-xs leading-5 ${featured ? 'text-white/75' : 'text-artisan-text-muted'}`}>{detail}</p>
  </article>
);

const MetricCard = ({ detail, featured = false, icon: Icon, label, value }) => (
  <article className={`rounded-[1.25rem] border p-4 shadow-lg transition-transform duration-200 hover:-translate-y-0.5 ${featured ? 'border-artisan-primary bg-artisan-primary text-white shadow-artisan-primary/20' : 'border-white/70 bg-white/95 text-artisan-text shadow-[#2D0E5A]/10'}`}>
    <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${featured ? 'bg-white/15 text-white' : 'bg-artisan-primary-wash text-artisan-primary'}`}>
      <Icon size={21} aria-hidden="true" />
    </span>
    <p className={`text-xs font-bold uppercase tracking-[0.1em] ${featured ? 'text-white/70' : 'text-artisan-text-muted'}`}>{label}</p>
    <p className={`mt-2 break-words text-2xl font-bold tabular-nums ${featured ? 'text-white' : 'text-artisan-text'}`}>{value}</p>
    <p className={`mt-2 text-xs leading-5 ${featured ? 'text-white/75' : 'text-artisan-text-muted'}`}>{detail}</p>
  </article>
);

const ScopeRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 border-b border-artisan-primary/10 pb-3 last:border-0 last:pb-0">
    <dt className="text-artisan-text-muted">{label}</dt>
    <dd className="font-bold text-artisan-text">{value}</dd>
  </div>
);

export default AdminAnalyticsTab;
