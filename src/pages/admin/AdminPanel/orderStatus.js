// Some early records used the shorter `awaiting` value. Treat it as the same
// review-entry state so those orders remain actionable without changing data.
export const REVIEW_ENTRY_STATUSES = ['pending', 'pending_review', 'awaiting', 'awaiting_review'];

export const POST_REVIEW_WORKFLOW_STATUSES = [
  'on_review',
  'accepted',
  'payment_confirmed',
  'processing',
  'shipping',
  'completed',
  'cancelled',
];

const NON_REVIEW_ORDER_STATUSES = new Set([
  ...POST_REVIEW_WORKFLOW_STATUSES,
  'declined',
  'cancellation_requested',
  'cancelled_pending_refund',
  'refunded',
]);

export const normalizeOrderStatus = (status) => String(status || '')
  .trim()
  .toLowerCase()
  .replace(/[\s/-]+/g, '_');

export const isAwaitingReview = (status) => {
  const normalizedStatus = normalizeOrderStatus(status);

  if (!normalizedStatus || REVIEW_ENTRY_STATUSES.includes(normalizedStatus)) {
    return true;
  }

  // The status badge intentionally presents legacy, unrecognised values as
  // "Awaiting Review". Keep the available admin action consistent with that
  // presentation, while known workflow and terminal statuses stay unchanged.
  return !NON_REVIEW_ORDER_STATUSES.has(normalizedStatus);
};

export const isPostReviewWorkflow = (status) =>
  POST_REVIEW_WORKFLOW_STATUSES.includes(normalizeOrderStatus(status));

export const isDeclinedOrder = (status) => normalizeOrderStatus(status) === 'declined';

export const hasOpenStatusCorrectionRequest = (order) =>
  order?.statusCorrectionRequest?.status === 'open';

const ADMIN_NEXT_STATUS_OPTIONS = {
  accepted: ['accepted', 'payment_confirmed', 'cancelled'],
  payment_confirmed: ['accepted', 'payment_confirmed', 'processing', 'cancelled'],
  processing: ['accepted', 'payment_confirmed', 'processing', 'shipping', 'cancelled'],
  shipping: ['accepted', 'payment_confirmed', 'processing', 'shipping', 'completed', 'cancelled'],
};

const SUB_ADMIN_NEXT_STATUS_OPTIONS = {
  accepted: ['accepted', 'payment_confirmed'],
  payment_confirmed: ['payment_confirmed', 'processing'],
  processing: ['processing', 'shipping'],
};

// "On review" is intentionally omitted. It is an approval checkpoint with
// dedicated Accept / Decline actions, not a selectable production status.
export const getNextWorkflowStatusOptions = (status, { isAdmin = false } = {}) => {
  const normalizedStatus = normalizeOrderStatus(status);
  const options = isAdmin
    ? ADMIN_NEXT_STATUS_OPTIONS[normalizedStatus]
    : SUB_ADMIN_NEXT_STATUS_OPTIONS[normalizedStatus];

  return options || [];
};

export const getCorrectionStatusOptions = (status) => {
  const normalizedStatus = normalizeOrderStatus(status);

  const options = {
    accepted: ['accepted'],
    payment_confirmed: ['accepted', 'payment_confirmed'],
    processing: ['accepted', 'payment_confirmed', 'processing'],
    shipping: ['accepted', 'payment_confirmed', 'processing', 'shipping'],
  };

  return options[normalizedStatus] || [];
};
