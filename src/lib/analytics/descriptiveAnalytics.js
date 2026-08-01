const COMPLETED_STATUS = 'completed';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toNonNegativeWholeNumber = (value) => Math.max(0, Math.floor(toNumber(value)));

export const toAnalyticsDate = (value) => {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const toLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateBoundary = (value, isEndOfDay = false) => {
  if (!value) return null;
  const parsed = new Date(`${value}T${isEndOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const isWithinRange = (order, startDate, endDate) => {
  const orderDate = toAnalyticsDate(order.createdAt);
  if (!orderDate) return !startDate && !endDate;
  if (startDate && orderDate < startDate) return false;
  if (endDate && orderDate > endDate) return false;
  return true;
};

const buildDateSeries = (dailyMap, startDate, endDate) => {
  const keys = [...dailyMap.keys()].sort();
  if (!keys.length) return [];

  const first = startDate || new Date(`${keys[0]}T00:00:00`);
  const last = endDate || new Date(`${keys[keys.length - 1]}T00:00:00`);
  const series = [];
  const cursor = new Date(first);
  cursor.setHours(0, 0, 0, 0);
  const lastDay = new Date(last);
  lastDay.setHours(0, 0, 0, 0);

  while (cursor <= lastDay) {
    const key = toLocalDateKey(cursor);
    const entry = dailyMap.get(key) || { revenue: 0, orders: 0 };
    series.push({ key, ...entry });
    cursor.setDate(cursor.getDate() + 1);
  }

  return series;
};

const STATUS_LABELS = {
  pending: 'Awaiting review',
  pending_review: 'Awaiting review',
  on_review: 'On review',
  payment_confirmed: 'Payment confirmed',
  processing: 'Processing',
  shipping: 'Shipping',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  'Cancellation Requested': 'Cancellation requested',
  'Cancelled – Pending Refund': 'Pending refund',
  Refunded: 'Refunded',
};

const getStatusLabel = (status) => STATUS_LABELS[status] || status || 'Unspecified';

export const buildDescriptiveAnalytics = ({
  orders = [],
  products = [],
  startDate: startDateValue = '',
  endDate: endDateValue = '',
}) => {
  const startDate = parseDateBoundary(startDateValue);
  const endDate = parseDateBoundary(endDateValue, true);
  const scopedOrders = orders.filter((order) => isWithinRange(order, startDate, endDate));
  const completedOrders = scopedOrders.filter((order) => order.status === COMPLETED_STATUS);
  const completedOrdersMissingDate = completedOrders.filter((order) => !toAnalyticsDate(order.createdAt)).length;
  const totalRevenue = completedOrders.reduce((total, order) => total + toNumber(order.total), 0);
  const completedOrderCount = completedOrders.length;
  const averageOrderValue = completedOrderCount ? totalRevenue / completedOrderCount : 0;

  const productMap = new Map(products.map((product) => [product.id, {
    id: product.id,
    name: product.name || 'Unnamed product',
    price: toNumber(product.price),
    totalSold: 0,
    revenue: 0,
    imageUrl: product.imageUrl || product.imageUrls?.[0] || '',
    stockQuantity: toNonNegativeWholeNumber(product.stockQuantity),
  }]));

  const dailyRevenueMap = new Map();
  let ordersMissingItems = 0;

  completedOrders.forEach((order) => {
    const orderDate = toAnalyticsDate(order.createdAt);
    if (orderDate) {
      const dayKey = toLocalDateKey(orderDate);
      const current = dailyRevenueMap.get(dayKey) || { revenue: 0, orders: 0 };
      current.revenue += toNumber(order.total);
      current.orders += 1;
      dailyRevenueMap.set(dayKey, current);
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
      ordersMissingItems += 1;
      return;
    }

    order.items.forEach((item) => {
      const productId = item.id || item.productId || item.name || 'unknown-product';
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          id: productId,
          name: item.name || 'Archived product',
          price: toNumber(item.price),
          totalSold: 0,
          revenue: 0,
          imageUrl: item.imageUrl || '',
          stockQuantity: 0,
        });
      }

      const product = productMap.get(productId);
      const quantity = toNonNegativeWholeNumber(item.quantity);
      product.totalSold += quantity;
      product.revenue += toNumber(item.price) * quantity;
    });
  });

  const productStats = [...productMap.values()].sort((first, second) =>
    second.totalSold - first.totalSold || second.revenue - first.revenue || first.name.localeCompare(second.name)
  );
  const soldProducts = productStats.filter((product) => product.totalSold > 0 || product.revenue > 0);
  const leastSoldProducts = [...productStats]
    .sort((first, second) => first.totalSold - second.totalSold || first.revenue - second.revenue || first.name.localeCompare(second.name))
    .slice(0, 10);

  const statusCounts = scopedOrders.reduce((counts, order) => {
    const label = getStatusLabel(order.status);
    counts.set(label, (counts.get(label) || 0) + 1);
    return counts;
  }, new Map());
  const statusBreakdown = [...statusCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label));

  const dailyRevenue = buildDateSeries(dailyRevenueMap, startDate, endDate);

  return {
    completedOrders,
    scopedOrders,
    totalRevenue,
    completedOrderCount,
    averageOrderValue,
    bestSellerUnits: soldProducts[0]?.totalSold || 0,
    productStats,
    topProducts: soldProducts.slice(0, 10),
    leastSoldProducts,
    statusBreakdown,
    dailyRevenue,
    dataQuality: {
      completedOrdersMissingDate,
      ordersMissingItems,
    },
    dateRange: {
      start: startDateValue,
      end: endDateValue,
      hasCustomRange: Boolean(startDateValue || endDateValue),
    },
  };
};

export const createRevenueOverTimeChartData = (dailyRevenue) => ({
  labels: dailyRevenue.map((entry) => entry.key),
  datasets: [{
    label: 'Daily Revenue',
    data: dailyRevenue.map((entry) => entry.revenue),
    borderColor: '#5C2D91',
    backgroundColor: 'rgba(92, 45, 145, 0.15)',
    tension: 0.3,
    fill: true,
  }],
});

export const createProductRevenueChartData = (products) => ({
  labels: products.map((product) => product.name.length > 15 ? `${product.name.slice(0, 15)}…` : product.name),
  datasets: [{
    label: 'Revenue',
    data: products.map((product) => product.revenue),
    backgroundColor: 'rgba(92, 45, 145, 0.78)',
    borderColor: '#5C2D91',
    borderWidth: 2,
  }],
});

const toDateInputValue = (date) => toLocalDateKey(date);

const getMetricDelta = (current, previous) => {
  const change = current - previous;
  if (previous === 0) {
    return {
      current,
      previous,
      change,
      percentage: current === 0 ? 0 : null,
      isNew: current > 0,
    };
  }

  return {
    current,
    previous,
    change,
    percentage: (change / previous) * 100,
    isNew: false,
  };
};

const getExceptionOrderCount = (orders) => orders.filter((order) => [
  'declined',
  'cancelled',
  'Cancellation Requested',
  'Cancelled – Pending Refund',
  'Refunded',
].includes(order.status)).length;

const createProductContributor = (currentProducts, previousProducts) => {
  const previousById = new Map(previousProducts.map((product) => [product.id, product]));
  const deltas = currentProducts.map((product) => {
    const previous = previousById.get(product.id) || { revenue: 0, totalSold: 0 };
    return {
      ...product,
      revenueChange: product.revenue - previous.revenue,
      previousRevenue: previous.revenue,
      unitChange: product.totalSold - previous.totalSold,
    };
  });

  previousProducts.forEach((product) => {
    if (currentProducts.some((current) => current.id === product.id)) return;
    deltas.push({
      ...product,
      revenue: 0,
      totalSold: 0,
      revenueChange: -product.revenue,
      previousRevenue: product.revenue,
      unitChange: -product.totalSold,
    });
  });

  return deltas
    .filter((product) => product.revenueChange !== 0)
    .sort((first, second) => Math.abs(second.revenueChange) - Math.abs(first.revenueChange))[0] || null;
};

export const buildDiagnosticAnalytics = ({
  orders = [],
  products = [],
  startDate = '',
  endDate = '',
}) => {
  if (!startDate || !endDate) {
    return {
      isAvailable: false,
      reason: 'Select both a start and end date to compare this period with the previous period.',
    };
  }

  const currentStart = parseDateBoundary(startDate);
  const currentEnd = parseDateBoundary(endDate, true);
  if (!currentStart || !currentEnd || currentEnd < currentStart) {
    return {
      isAvailable: false,
      reason: 'Choose a valid date range to run the comparison.',
    };
  }

  const periodDays = Math.round((new Date(`${endDate}T00:00:00`).getTime() - new Date(`${startDate}T00:00:00`).getTime()) / 86400000) + 1;
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - (periodDays - 1));

  const current = buildDescriptiveAnalytics({ orders, products, startDate, endDate });
  const previous = buildDescriptiveAnalytics({
    orders,
    products,
    startDate: toDateInputValue(previousStart),
    endDate: toDateInputValue(previousEnd),
  });

  const revenue = getMetricDelta(current.totalRevenue, previous.totalRevenue);
  const orderCount = getMetricDelta(current.completedOrderCount, previous.completedOrderCount);
  const averageOrderValue = getMetricDelta(current.averageOrderValue, previous.averageOrderValue);
  const exceptions = getMetricDelta(
    getExceptionOrderCount(current.scopedOrders),
    getExceptionOrderCount(previous.scopedOrders)
  );
  const leadingProduct = createProductContributor(current.productStats, previous.productStats);
  const contributors = [];

  if (leadingProduct) {
    contributors.push({
      id: `product-${leadingProduct.id}`,
      type: 'product',
      title: leadingProduct.name,
      change: leadingProduct.revenueChange,
      description: leadingProduct.revenueChange > 0
        ? 'Completed-order revenue increased and may have contributed to the period change.'
        : 'Completed-order revenue decreased and may have contributed to the period change.',
    });
  }

  if (orderCount.change !== 0) {
    contributors.push({
      id: 'order-count',
      type: 'orders',
      change: orderCount.change,
      description: orderCount.change > 0
        ? 'More completed orders were recorded in this period.'
        : 'Fewer completed orders were recorded in this period.',
    });
  }

  if (averageOrderValue.change !== 0) {
    contributors.push({
      id: 'average-order-value',
      type: 'aov',
      change: averageOrderValue.change,
      description: averageOrderValue.change > 0
        ? 'Average completed order value increased in this period.'
        : 'Average completed order value decreased in this period.',
    });
  }

  if (exceptions.change !== 0) {
    contributors.push({
      id: 'exceptions',
      type: 'exceptions',
      change: exceptions.change,
      description: exceptions.change > 0
        ? 'More declined, cancelled, refund, or cancellation-requested orders were recorded.'
        : 'Fewer declined, cancelled, refund, or cancellation-requested orders were recorded.',
    });
  }

  return {
    isAvailable: true,
    periodDays,
    currentRange: { startDate, endDate },
    previousRange: {
      startDate: toDateInputValue(previousStart),
      endDate: toDateInputValue(previousEnd),
    },
    metrics: {
      revenue,
      orderCount,
      averageOrderValue,
      exceptions,
    },
    contributors: contributors.slice(0, 3),
  };
};

const getTrendDirection = (slope, averageDailyRevenue) => {
  const meaningfulDailyChange = Math.max(1, averageDailyRevenue * 0.02);
  if (slope > meaningfulDailyChange) return 'upward';
  if (slope < -meaningfulDailyChange) return 'downward';
  return 'stable';
};

const getConfidenceGuidance = ({ activeDayRatio, activeDays, historyDays, variationRatio }) => {
  if (activeDayRatio < 0.15) {
    return {
      level: 'low',
      detail: 'Completed revenue appears on too few days in this history. Treat this as a sparse-data signal, not a dependable demand estimate.',
    };
  }

  if (historyDays >= 56 && activeDays >= 14 && variationRatio <= 0.75) {
    return {
      level: 'moderate',
      detail: 'There is a longer history with manageable day-to-day variation. This is still a planning estimate, not a guarantee.',
    };
  }

  if (historyDays >= 28 && activeDays >= 7) {
    return {
      level: 'limited',
      detail: 'There is enough history for a directional estimate, but variation or limited observations can materially change the outcome.',
    };
  }

  return {
    level: 'low',
    detail: 'The available history is short or sparse. Use this only as an early planning signal and review it frequently.',
  };
};

export const buildTrendForecast = ({ dailyRevenue = [], horizonDays = 30 }) => {
  const normalizedHorizonDays = Math.max(1, Math.min(90, Math.floor(toNumber(horizonDays)) || 30));
  const history = dailyRevenue
    .map((entry, index) => ({
      index,
      key: entry.key,
      revenue: Math.max(0, toNumber(entry.revenue)),
    }))
    .filter((entry) => entry.key);
  const historyDays = history.length;
  const activeDays = history.filter((entry) => entry.revenue > 0).length;
  const activeDayRatio = historyDays ? activeDays / historyDays : 0;

  if (historyDays < 7 || activeDays < 3) {
    return {
      isAvailable: false,
      horizonDays: normalizedHorizonDays,
      historyDays,
      activeDays,
      reason: 'A forecast needs at least 7 calendar days and 3 days with completed revenue in the selected scope.',
      method: 'Simple linear trend from daily completed-order revenue. It does not use external or paid data.',
    };
  }

  const averageX = (historyDays - 1) / 2;
  const averageDailyRevenue = history.reduce((total, entry) => total + entry.revenue, 0) / historyDays;
  const numerator = history.reduce((total, entry) => total + ((entry.index - averageX) * (entry.revenue - averageDailyRevenue)), 0);
  const denominator = history.reduce((total, entry) => total + ((entry.index - averageX) ** 2), 0);
  const slope = denominator ? numerator / denominator : 0;
  const intercept = averageDailyRevenue - (slope * averageX);
  const projectedDailyRevenue = Array.from({ length: normalizedHorizonDays }, (_, index) => (
    Math.max(0, intercept + (slope * (historyDays + index)))
  ));
  const projectedRevenue = projectedDailyRevenue.reduce((total, value) => total + value, 0);
  const meanAbsoluteError = history.reduce((total, entry) => (
    total + Math.abs(entry.revenue - Math.max(0, intercept + (slope * entry.index)))
  ), 0) / historyDays;
  const variationRatio = averageDailyRevenue ? meanAbsoluteError / averageDailyRevenue : 1;
  const scenarioSpread = meanAbsoluteError * normalizedHorizonDays;
  const lastDate = new Date(`${history[history.length - 1].key}T00:00:00`);
  const forecastStart = new Date(lastDate);
  forecastStart.setDate(forecastStart.getDate() + 1);
  const forecastEnd = new Date(forecastStart);
  forecastEnd.setDate(forecastEnd.getDate() + normalizedHorizonDays - 1);
  const projectedDailyAverage = projectedRevenue / normalizedHorizonDays;

  return {
    isAvailable: true,
    horizonDays: normalizedHorizonDays,
    historyDays,
    activeDays,
    averageDailyRevenue,
    projectedDailyAverage,
    projectedRevenue,
    scenarioRange: {
      low: Math.max(0, projectedRevenue - scenarioSpread),
      high: projectedRevenue + scenarioSpread,
    },
    trendDirection: getTrendDirection(slope, averageDailyRevenue),
    trendPercent: averageDailyRevenue
      ? ((projectedDailyAverage - averageDailyRevenue) / averageDailyRevenue) * 100
      : 0,
    confidence: getConfidenceGuidance({ activeDayRatio, activeDays, historyDays, variationRatio }),
    forecastRange: {
      startDate: toLocalDateKey(forecastStart),
      endDate: toLocalDateKey(forecastEnd),
    },
    method: 'Simple linear trend from daily completed-order revenue. It does not account for seasonality, marketing, stock changes, or external events.',
    avgDaily: averageDailyRevenue,
    nextMonth: projectedRevenue,
    baseDays: historyDays,
  };
};

export const buildPrescriptiveRecommendations = ({
  descriptiveAnalytics,
  diagnosticAnalytics,
  forecast,
}) => {
  if (!forecast.isAvailable) {
    return [{
      id: 'build-history',
      priority: 'Foundation',
      title: 'Build a usable revenue history',
      description: 'Continue recording completed orders with valid dates and item details. Revisit the forecast once the selected scope has enough completed-revenue days.',
    }];
  }

  const recommendations = [];
  const bestSeller = descriptiveAnalytics.topProducts[0];

  if (forecast.trendDirection === 'upward') {
    recommendations.push({
      id: 'prepare-capacity',
      priority: 'Plan',
      title: 'Check capacity before demand increases',
      description: bestSeller
        ? `Review stock and fulfillment capacity for ${bestSeller.name}, then plan only reversible replenishment steps.`
        : 'Review stock and fulfillment capacity, then plan only reversible replenishment steps.',
    });
  } else if (forecast.trendDirection === 'downward') {
    recommendations.push({
      id: 'investigate-decline',
      priority: 'Review',
      title: 'Investigate the downward signal before acting',
      description: 'Review the diagnostic contributors, product availability, and customer feedback. Test one small, measurable change before committing to a larger promotion or inventory decision.',
    });
  } else {
    recommendations.push({
      id: 'monitor-stable',
      priority: 'Monitor',
      title: 'Keep the current plan under review',
      description: 'Demand appears broadly stable in the selected history. Recheck this forecast weekly and use actual completed orders to guide small adjustments.',
    });
  }

  if (forecast.confidence.level !== 'moderate') {
    recommendations.push({
      id: 'use-caution',
      priority: 'Caution',
      title: 'Keep decisions reversible',
      description: 'Confidence is limited by the available history or variation. Do not use this estimate alone for large stock, staffing, or spending commitments.',
    });
  }

  if (diagnosticAnalytics?.isAvailable && diagnosticAnalytics.metrics.exceptions.change > 0) {
    recommendations.push({
      id: 'review-exceptions',
      priority: 'Review',
      title: 'Review recent order exceptions',
      description: 'Declined, cancelled, refund, or cancellation-requested orders increased in the comparison period. Review their reasons before assuming demand is the only factor.',
    });
  }

  return recommendations.slice(0, 3);
};
