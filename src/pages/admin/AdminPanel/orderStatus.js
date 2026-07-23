export const REVIEW_ENTRY_STATUSES = ['pending', 'pending_review'];

export const POST_REVIEW_WORKFLOW_STATUSES = [
  'on_review',
  'payment_confirmed',
  'processing',
  'shipping',
  'completed',
  'cancelled',
];

export const isAwaitingReview = (status) =>
  REVIEW_ENTRY_STATUSES.includes(status || 'pending');

export const isPostReviewWorkflow = (status) =>
  POST_REVIEW_WORKFLOW_STATUSES.includes(status || '');

export const isDeclinedOrder = (status) => status === 'declined';
