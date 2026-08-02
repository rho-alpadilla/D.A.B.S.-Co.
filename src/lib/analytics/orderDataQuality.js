const hasValidNumber = (value) => {
  if (value === '' || value === null || value === undefined) return false;
  return Number.isFinite(Number(value)) && Number(value) >= 0;
};

const hasPositiveQuantity = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

const hasProductReference = (item) => Boolean(item?.id || item?.productId || item?.name);

const hasValidOrderDate = (value) => {
  if (!value) return false;
  if (typeof value?.toDate === 'function') return Number.isFinite(value.toDate().getTime());
  if (value instanceof Date) return Number.isFinite(value.getTime());
  if (typeof value?.seconds === 'number') return Number.isFinite(new Date(value.seconds * 1000).getTime());
  return Number.isFinite(new Date(value).getTime());
};

export const getOrderAnalyticsDataIssues = (order = {}) => {
  const issues = [];

  if (!hasValidOrderDate(order.createdAt)) {
    issues.push({ code: 'missing-date', label: 'Missing valid order date' });
  }

  if (!hasValidNumber(order.total)) {
    issues.push({ code: 'missing-total', label: 'Missing valid order total' });
  }

  if (!Array.isArray(order.items) || order.items.length === 0) {
    issues.push({ code: 'missing-items', label: 'Missing order items' });
    return issues;
  }

  const hasInvalidLineItem = order.items.some((item) => (
    !hasProductReference(item) ||
    !hasPositiveQuantity(item?.quantity) ||
    !hasValidNumber(item?.price)
  ));

  if (hasInvalidLineItem) {
    issues.push({ code: 'invalid-item-details', label: 'Incomplete item details' });
  }

  return issues;
};

export const validateOrderForAnalytics = (order) => {
  const issues = getOrderAnalyticsDataIssues(order);

  return {
    isValid: issues.length === 0,
    issues,
  };
};

export const buildAnalyticsDataQualityReport = (orders = []) => {
  const records = orders
    .map((order) => ({
      orderId: order.id || 'unknown-order',
      buyerEmail: order.buyerEmail || 'No buyer email',
      issues: getOrderAnalyticsDataIssues(order),
      reviewedBy: order.dataQualityReview?.reviewedBy || null,
      reviewedAt: order.dataQualityReview?.reviewedAt || null,
    }))
    .filter((record) => record.issues.length > 0);

  const countByIssue = records.reduce((counts, record) => {
    record.issues.forEach((issue) => {
      counts[issue.code] = (counts[issue.code] || 0) + 1;
    });
    return counts;
  }, {});

  return {
    records,
    affectedOrderCount: records.length,
    missingDateCount: countByIssue['missing-date'] || 0,
    missingTotalCount: countByIssue['missing-total'] || 0,
    missingItemsCount: (countByIssue['missing-items'] || 0) + (countByIssue['invalid-item-details'] || 0),
  };
};
