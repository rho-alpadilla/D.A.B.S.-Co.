import React, { useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  CalendarRange,
  DollarSign,
  Package,
  ShoppingCart,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { downloadAnalyticsWordReport } from '@/lib/exports/adminExports';

const EmptyChartState = ({ icon: Icon, title, detail }) => (
  <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-artisan-primary/20 bg-artisan-primary-wash/25 px-6 text-center">
    <Icon size={30} className="mb-3 text-artisan-primary-pale" />
    <p className="font-semibold text-artisan-text">{title}</p>
    <p className="mt-1 text-sm text-artisan-text-muted">{detail}</p>
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
  revenueChartData,
  revenueOverTimeData,
  setCustomEndDate,
  setCustomStartDate,
  user,
}) => {
  const [exportMessage, setExportMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleAnalyticsExport = async () => {
    if (!isAdmin) {
      setExportMessage('Only the main admin can export analytics.');
      return;
    }

    setIsExporting(true);
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
    } catch (error) {
      console.error('Unable to export analytics', error);
      setExportMessage('The report could not be created. Please try again.');
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
  const scopeLabel = dateRange.hasCustomRange
    ? `${customStartDate || 'the first available date'} to ${customEndDate || 'today'}`
    : 'all recorded completed orders';

  return (
    <div className="flex flex-col gap-5">
      <section className="order-0 flex flex-col gap-4 rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Analytics report</p>
          <h2 className="mt-1 font-nunito text-3xl font-bold text-artisan-text">Business overview</h2>
          <p className="mt-1 text-sm text-artisan-text-muted">Showing {scopeLabel}.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:items-end">
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">
            From
            <input type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} max={customEndDate || undefined} className="h-11 w-full rounded-xl border border-artisan-border bg-white px-4 text-sm normal-case tracking-normal text-artisan-text outline-none transition-[border-color,box-shadow] duration-200 focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15" />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-artisan-text-muted">
            To
            <input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} min={customStartDate || undefined} className="h-11 w-full rounded-xl border border-artisan-border bg-white px-4 text-sm normal-case tracking-normal text-artisan-text outline-none transition-[border-color,box-shadow] duration-200 focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15" />
          </label>
          <Button type="button" variant="outline" onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }} className="h-11 w-full sm:w-auto" disabled={!customStartDate && !customEndDate}>
            Clear
          </Button>
          <Button type="button" onClick={handleAnalyticsExport} className="h-11 w-full sm:w-auto" disabled={isExporting}>
            {isExporting ? 'Preparing report…' : 'Download Word'}
          </Button>
        </div>
        <p className="text-sm text-artisan-text-muted" role="status" aria-live="polite">{exportMessage}</p>
      </section>

      <div className="order-1 pt-2">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Descriptive analytics</p>
        <h3 className="mt-1 font-nunito text-2xl font-bold text-artisan-text">What happened</h3>
        <p className="mt-1 text-sm text-artisan-text-muted">Revenue, orders, products, and data quality for the selected scope.</p>
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

      <section className="order-1 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={DollarSign} label="Completed revenue" value={formatPrice(totalRevenue)} tone="text-artisan-primary" />
        <MetricCard icon={ShoppingCart} label="Completed orders" value={completedOrderCount} tone="text-sky-600" />
        <MetricCard icon={TrendingUp} label="Average order value" value={formatPrice(averageOrderValue)} tone="text-amber-600" />
        <MetricCard icon={Award} label="Best seller units" value={bestSellerUnits} tone="text-rose-600" />
      </section>

      <section className="order-2 rounded-[1.5rem] border border-artisan-primary/15 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Diagnostic analytics</p>
            <h3 className="mt-1 flex items-center gap-2 font-nunito text-2xl font-bold text-artisan-text"><BarChart3 className="text-artisan-primary" size={24} /> Why might it have changed?</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-artisan-text-muted">This compares equal-length periods using recorded orders. It identifies possible contributors, not proof of cause.</p>
          </div>
          {diagnosticAnalytics.isAvailable && (
            <div className="shrink-0 rounded-xl bg-artisan-primary-wash/50 px-3 py-2 text-xs leading-5 text-artisan-text-muted">
              <span className="block font-semibold text-artisan-text">{diagnosticAnalytics.periodDays}-day comparison</span>
              <span>{formatComparisonDateRange(diagnosticAnalytics.currentRange)} vs {formatComparisonDateRange(diagnosticAnalytics.previousRange)}</span>
            </div>
          )}
        </div>

        {!diagnosticAnalytics.isAvailable ? (
          <div className="mt-5 h-44">
            <EmptyChartState icon={CalendarRange} title="Comparison needs a complete period" detail={diagnosticAnalytics.reason} />
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <DiagnosticMetricCard label="Completed revenue" metric={diagnosticAnalytics.metrics.revenue} value={formatPrice(diagnosticAnalytics.metrics.revenue.current)} previousValue={formatPrice(diagnosticAnalytics.metrics.revenue.previous)} higherIsBetter />
              <DiagnosticMetricCard label="Completed orders" metric={diagnosticAnalytics.metrics.orderCount} value={diagnosticAnalytics.metrics.orderCount.current} previousValue={diagnosticAnalytics.metrics.orderCount.previous} higherIsBetter />
              <DiagnosticMetricCard label="Average order value" metric={diagnosticAnalytics.metrics.averageOrderValue} value={formatPrice(diagnosticAnalytics.metrics.averageOrderValue.current)} previousValue={formatPrice(diagnosticAnalytics.metrics.averageOrderValue.previous)} higherIsBetter />
              <DiagnosticMetricCard label="Order exceptions" metric={diagnosticAnalytics.metrics.exceptions} value={diagnosticAnalytics.metrics.exceptions.current} previousValue={diagnosticAnalytics.metrics.exceptions.previous} higherIsBetter={false} />
            </div>

            <div className="mt-5 rounded-2xl border border-artisan-primary/10 bg-artisan-primary-wash/25 p-4">
              <h4 className="font-nunito font-semibold text-artisan-text">Possible contributors</h4>
              <p className="mt-1 text-sm text-artisan-text-muted">Evidence from the compared periods only. Review product availability, campaigns, and customer feedback separately before making a decision.</p>
              {diagnosticAnalytics.contributors.length ? (
                <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  {diagnosticAnalytics.contributors.map((contributor) => (
                    <li key={contributor.id} className="rounded-xl border border-white bg-white/85 p-3 text-sm shadow-sm shadow-[#2D0E5A]/5">
                      <p className="font-semibold text-artisan-text">{getContributorLabel(contributor)}</p>
                      <p className={`mt-1 font-bold ${contributor.change > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatContributorChange(contributor, formatPrice)}</p>
                      <p className="mt-2 leading-5 text-artisan-text-muted">{contributor.description}</p>
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
            <Line data={revenueOverTimeData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
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
            <ScopeRow label="Completed orders" value={completedOrderCount} />
            <ScopeRow label="Products represented" value={descriptiveAnalytics.productStats.length} />
            <ScopeRow label="Daily revenue points" value={dailyRevenue.length} />
          </dl>
          <p className="mt-5 rounded-xl bg-artisan-primary-wash/50 p-3 text-xs leading-5 text-artisan-text-muted">Revenue excludes pending, declined, cancelled, and refunded orders. Product rankings use completed order line items only.</p>
        </div>
      </section>

      <section className="order-1 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
          <h3 className="mb-4 flex items-center gap-2 font-nunito text-2xl font-bold text-artisan-text"><Award className="text-amber-500" size={24} /> Top sellers</h3>
          <ProductList products={topProducts} formatPrice={formatPrice} type="top" />
        </div>
        <div className="rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
          <h3 className="mb-4 font-nunito text-2xl font-bold text-artisan-text">Least sold products</h3>
          <ProductList products={leastSoldProducts} formatPrice={formatPrice} type="least" />
        </div>
      </section>

      <section className="order-1 rounded-[1.5rem] border border-white/60 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10">
        <h3 className="mb-4 font-nunito text-2xl font-bold text-artisan-text">Revenue by product</h3>
        <div className="h-56 sm:h-64">
          {hasProductRevenueData ? (
            <Bar data={revenueChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
          ) : (
            <EmptyChartState icon={Award} title="No product revenue to compare" detail="This chart populates after completed product sales." />
          )}
        </div>
      </section>

      <section className="order-3 rounded-[1.5rem] border border-artisan-primary/20 bg-artisan-primary-wash/45 p-5 text-artisan-text shadow-lg shadow-[#2D0E5A]/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Predictive analytics</p>
            <h3 className="mt-1 flex items-center gap-2 font-nunito text-2xl font-bold"><TrendingUp className="text-artisan-primary" size={24} /> What might happen next?</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-artisan-text-muted">A no-cost, on-device projection based on completed-order revenue only. It is a planning estimate, not a guarantee or an automated decision.</p>
          </div>
          {forecast.isAvailable && (
            <div className="shrink-0 rounded-xl border border-artisan-primary/15 bg-white/80 px-3 py-2 text-xs leading-5 text-artisan-text-muted">
              <span className="block font-semibold text-artisan-text">Next {forecast.horizonDays} days</span>
              <span>{formatComparisonDateRange(forecast.forecastRange)}</span>
            </div>
          )}
        </div>

        {!forecast.isAvailable ? (
          <div className="mt-5 h-44">
            <EmptyChartState icon={TrendingUp} title="Forecast not ready" detail={forecast.reason} />
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ForecastMetricCard label={`${forecast.horizonDays}-day revenue estimate`} value={formatPrice(forecast.projectedRevenue)} detail={`${forecast.trendDirection} trend from ${forecast.historyDays} calendar days`} />
              <ForecastMetricCard label="Estimated daily average" value={formatPrice(forecast.projectedDailyAverage)} detail={`Historical average: ${formatPrice(forecast.averageDailyRevenue)} per day`} />
              <ForecastMetricCard label="Confidence guidance" value={forecast.confidence.level} detail={forecast.confidence.detail} valueClassName={getConfidenceTone(forecast.confidence.level)} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-artisan-primary/10 bg-white/75 p-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-semibold text-artisan-text">Scenario band</p>
                <p className="mt-1 text-2xl font-bold text-artisan-primary">{formatPrice(forecast.scenarioRange.low)} - {formatPrice(forecast.scenarioRange.high)}</p>
                <p className="mt-1 text-xs leading-5 text-artisan-text-muted">A planning range based on the average historical daily forecasting error. It is not a statistical confidence interval.</p>
              </div>
              <div className="border-t border-artisan-primary/10 pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                <p className="text-sm font-semibold text-artisan-text">Method and limits</p>
                <p className="mt-1 text-sm leading-6 text-artisan-text-muted">{forecast.method} The estimate uses {forecast.activeDays} completed-revenue days within {forecast.historyDays} calendar days.</p>
              </div>
            </div>
          </>
        )}

        <div className="mt-5 border-t border-artisan-primary/15 pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Prescriptive analytics</p>
          <h4 className="mt-1 font-nunito text-xl font-bold">What should we do next?</h4>
          <p className="mt-1 text-sm text-artisan-text-muted">Suggested actions require admin judgement; nothing is automatically changed by this panel.</p>
          <ul className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {prescriptiveRecommendations.map((recommendation) => (
              <li key={recommendation.id} className="rounded-xl border border-white/80 bg-white/85 p-4 shadow-sm shadow-[#2D0E5A]/5">
                <span className="inline-flex rounded-full bg-artisan-primary-wash px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-artisan-primary">{recommendation.priority}</span>
                <p className="mt-3 font-semibold text-artisan-text">{recommendation.title}</p>
                <p className="mt-2 text-sm leading-6 text-artisan-text-muted">{recommendation.description}</p>
              </li>
            ))}
          </ul>
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
  `${formatComparisonDate(startDate)} - ${formatComparisonDate(endDate)}`
);

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
    <div className="rounded-2xl border border-artisan-primary/10 bg-white p-4">
      <p className="text-sm font-semibold text-artisan-text-muted">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-artisan-text">{value}</p>
      <p className="mt-1 text-xs text-artisan-text-muted">Previous: {previousValue}</p>
      <p className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${changeTone}`}>
        {changed && <Icon size={14} />}
        {getChangeLabel(metric)}
      </p>
    </div>
  );
};

const getConfidenceTone = (level) => ({
  moderate: 'text-emerald-700',
  limited: 'text-amber-700',
  low: 'text-rose-700',
}[level] || 'text-artisan-text');

const ForecastMetricCard = ({ detail, label, value, valueClassName = 'text-artisan-text' }) => (
  <div className="rounded-2xl border border-artisan-primary/10 bg-white/85 p-4">
    <p className="text-sm font-semibold text-artisan-text-muted">{label}</p>
    <p className={`mt-2 break-words text-2xl font-bold capitalize ${valueClassName}`}>{value}</p>
    <p className="mt-2 text-xs leading-5 text-artisan-text-muted">{detail}</p>
  </div>
);

const MetricCard = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-[1.25rem] border border-white/60 bg-white/95 p-4 shadow-lg shadow-[#2D0E5A]/10">
    <Icon size={25} className={`mb-2 ${tone}`} />
    <p className="break-words text-2xl font-bold text-artisan-text">{value}</p>
    <p className="mt-1 text-sm font-semibold text-artisan-text-muted">{label}</p>
  </div>
);

const ScopeRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 border-b border-artisan-primary/10 pb-3 last:border-0 last:pb-0">
    <dt className="text-artisan-text-muted">{label}</dt>
    <dd className="font-bold text-artisan-text">{value}</dd>
  </div>
);

export default AdminAnalyticsTab;
