import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const ARCHIVABLE_ORDER_STATUSES = new Set([
  'completed',
  'declined',
  'cancelled',
  'Refunded',
]);

const DELETION_CONFIRMATION_PREFIX = 'DELETE #';

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

const requireOrderId = (order) => {
  if (!order?.id) throw new Error('The selected order is no longer available. Refresh and try again.');
};

const requireAdminActor = (actorUid) => {
  if (!actorUid) throw new Error('Only the main admin can manage archived orders.');
};

const requireArchivableStatus = (order) => {
  if (!ARCHIVABLE_ORDER_STATUSES.has(order?.status)) {
    throw new Error('Only completed, declined, cancelled, or refunded orders can be archived.');
  }
};

export const normalizeLifecycleReason = (value) => String(value || '').trim();

export const validateLifecycleReason = (value) => {
  const reason = normalizeLifecycleReason(value);
  if (reason.length < MIN_REASON_LENGTH) {
    return { isValid: false, message: `Enter at least ${MIN_REASON_LENGTH} characters for the audit reason.` };
  }
  if (reason.length > MAX_REASON_LENGTH) {
    return { isValid: false, message: `Keep the audit reason within ${MAX_REASON_LENGTH} characters.` };
  }
  return { isValid: true, reason };
};

export const getDeletionConfirmationPhrase = (order) => (
  `${DELETION_CONFIRMATION_PREFIX}${String(order?.id || '').slice(0, 8)}`
);

const requireReviewedInvalidOrder = (order, actorUid) => {
  if (order?.dataQualityReview?.reviewedBy !== actorUid) {
    throw new Error('Only the main admin who reviewed this incomplete record can permanently delete it.');
  }

  const hasAnalyticsFields = (
    order?.createdAt &&
    Number.isFinite(Number(order?.total)) &&
    Number(order.total) >= 0 &&
    Array.isArray(order?.items) &&
    order.items.length > 0
  );

  if (hasAnalyticsFields) {
    throw new Error('Valid orders must be archived instead of permanently deleted.');
  }

  const protectedStatuses = new Set([
    'paid',
    'payment_confirmed',
    'processing',
    'shipping',
    'completed',
    'Refunded',
  ]);
  if (protectedStatuses.has(order?.status) || order?.paidAt || order?.paymentId) {
    throw new Error('Paid, processing, shipped, completed, and refunded orders must be archived instead of permanently deleted.');
  }
};

const createLifecycleAudit = ({ order, actorUid, action, reason }) => ({
  orderId: order.id,
  action,
  previousStatus: order.status,
  actorUid,
  occurredAt: serverTimestamp(),
  reason,
});

const getPreviousRestoreMetadata = (archive = {}) => ({
  restoredAt: archive.restoredAt || null,
  restoredBy: archive.restoredBy || null,
  restoreReason: archive.restoreReason || '',
});

export const archiveOrder = async ({ order, actorUid, reason }) => {
  requireOrderId(order);
  requireAdminActor(actorUid);
  requireArchivableStatus(order);
  if (order.archive?.isArchived) throw new Error('This order is already archived.');

  const reasonValidation = validateLifecycleReason(reason);
  if (!reasonValidation.isValid) throw new Error(reasonValidation.message);

  const auditRef = doc(collection(db, 'orderLifecycleAudits'));
  const orderRef = doc(db, 'orders', order.id);
  const batch = writeBatch(db);

  batch.set(auditRef, createLifecycleAudit({
    order,
    actorUid,
    action: 'archived',
    reason: reasonValidation.reason,
  }));
  batch.update(orderRef, {
    archive: {
      isArchived: true,
      archivedAt: serverTimestamp(),
      archivedBy: actorUid,
      reason: reasonValidation.reason,
      ...getPreviousRestoreMetadata(order.archive),
      lastLifecycleAuditId: auditRef.id,
    },
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return { auditId: auditRef.id };
};

export const restoreArchivedOrder = async ({ order, actorUid, reason }) => {
  requireOrderId(order);
  requireAdminActor(actorUid);
  requireArchivableStatus(order);
  if (!order.archive?.isArchived) throw new Error('This order is not archived.');

  const reasonValidation = validateLifecycleReason(reason);
  if (!reasonValidation.isValid) throw new Error(reasonValidation.message);

  const auditRef = doc(collection(db, 'orderLifecycleAudits'));
  const orderRef = doc(db, 'orders', order.id);
  const batch = writeBatch(db);

  batch.set(auditRef, createLifecycleAudit({
    order,
    actorUid,
    action: 'restored',
    reason: reasonValidation.reason,
  }));
  batch.update(orderRef, {
    archive: {
      isArchived: false,
      archivedAt: order.archive.archivedAt,
      archivedBy: order.archive.archivedBy,
      reason: order.archive.reason,
      restoredAt: serverTimestamp(),
      restoredBy: actorUid,
      restoreReason: reasonValidation.reason,
      lastLifecycleAuditId: auditRef.id,
    },
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return { auditId: auditRef.id };
};


export const permanentlyDeleteReviewedInvalidOrder = async ({
  order,
  actorUid,
  reason,
  confirmation,
}) => {
  requireOrderId(order);
  requireAdminActor(actorUid);
  requireReviewedInvalidOrder(order, actorUid);

  const reasonValidation = validateLifecycleReason(reason);
  if (!reasonValidation.isValid) throw new Error(reasonValidation.message);

  const requiredConfirmation = getDeletionConfirmationPhrase(order);
  if (String(confirmation || '').trim() !== requiredConfirmation) {
    throw new Error(`Type ${requiredConfirmation} exactly to permanently delete this record.`);
  }

  const orderRef = doc(db, 'orders', order.id);
  const auditRef = doc(db, 'orderDeletionAudits', order.id);
  const batch = writeBatch(db);

  batch.set(auditRef, {
    orderId: order.id,
    action: 'permanently_deleted',
    previousStatus: String(order.status || 'unknown'),
    actorUid,
    occurredAt: serverTimestamp(),
    reason: reasonValidation.reason,
    reviewedBy: order.dataQualityReview.reviewedBy,
    reviewedAt: order.dataQualityReview.reviewedAt,
  });
  batch.delete(orderRef);

  await batch.commit();
  return { auditId: auditRef.id };
};
