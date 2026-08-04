import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const ARCHIVABLE_ORDER_STATUSES = new Set([
  'completed',
  'cancelled',
  'declined',
]);

const BULK_ARCHIVE_CHUNK_SIZE = 8;

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
    throw new Error('Only completed, cancelled, or declined orders can be moved to the recycle bin.');
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

// This snapshot is retained only in immutable, main-admin-readable deletion
// audits. It supports operational exports after the original order is gone,
// without copying payment references or other unnecessary payment data.
const createDeletionOrderSnapshot = (order) => ({
  buyerName: String(order?.buyerName || ''),
  buyerEmail: String(order?.buyerEmail || ''),
  shippingInfo: order?.shippingInfo || {},
  deliveryMethod: String(order?.deliveryMethod || ''),
  paymentMethod: String(order?.paymentMethod || ''),
  createdAt: order?.createdAt || null,
  items: Array.isArray(order?.items) ? order.items : [],
  total: order?.total ?? 0,
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

const addArchiveWrites = ({ batch, order, actorUid, reason }) => {
  const auditRef = doc(collection(db, 'orderLifecycleAudits'));
  const orderRef = doc(db, 'orders', order.id);

  batch.set(auditRef, createLifecycleAudit({
    order,
    actorUid,
    action: 'archived',
    reason,
  }));
  batch.update(orderRef, {
    archive: {
      isArchived: true,
      archivedAt: serverTimestamp(),
      archivedBy: actorUid,
      reason,
      ...getPreviousRestoreMetadata(order.archive),
      lastLifecycleAuditId: auditRef.id,
    },
    updatedAt: serverTimestamp(),
  });
};

export const archiveOrders = async ({ orders, actorUid, reason }) => {
  requireAdminActor(actorUid);

  const uniqueOrders = Array.from(new Map(
    (Array.isArray(orders) ? orders : []).map((order) => [order?.id, order]),
  ).values());

  if (uniqueOrders.length === 0) {
    throw new Error('Select at least one completed, cancelled, or declined order.');
  }

  uniqueOrders.forEach((order) => {
    requireOrderId(order);
    requireArchivableStatus(order);
    if (order.archive?.isArchived) throw new Error('An order already in the recycle bin cannot be selected.');
  });

  const reasonValidation = validateLifecycleReason(reason);
  if (!reasonValidation.isValid) throw new Error(reasonValidation.message);

  let archivedCount = 0;
  for (let index = 0; index < uniqueOrders.length; index += BULK_ARCHIVE_CHUNK_SIZE) {
    const chunk = uniqueOrders.slice(index, index + BULK_ARCHIVE_CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((order) => addArchiveWrites({
      batch,
      order,
      actorUid,
      reason: reasonValidation.reason,
    }));

    try {
      await batch.commit();
      archivedCount += chunk.length;
    } catch (error) {
      const remainingCount = uniqueOrders.length - archivedCount;
      throw new Error(
        archivedCount > 0
          ? `${archivedCount} order${archivedCount === 1 ? '' : 's'} moved to the recycle bin. ${remainingCount} remaining order${remainingCount === 1 ? '' : 's'} could not be moved.`
          : (error?.message || 'The selected orders could not be moved to the recycle bin.'),
      );
    }
  }

  return { archivedCount };
};

export const restoreArchivedOrder = async ({ order, actorUid, reason }) => {
  requireOrderId(order);
  requireAdminActor(actorUid);
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
    orderSnapshot: createDeletionOrderSnapshot(order),
  });
  batch.delete(orderRef);

  await batch.commit();
  return { auditId: auditRef.id };
};

export const permanentlyDeleteArchivedOrder = async ({
  order,
  actorUid,
  reason,
  confirmation,
}) => {
  requireOrderId(order);
  requireAdminActor(actorUid);
  requireArchivableStatus(order);
  if (!order.archive?.isArchived) {
    throw new Error('Only completed, cancelled, or declined orders in the recycle bin can be permanently deleted.');
  }

  const reasonValidation = validateLifecycleReason(reason);
  if (!reasonValidation.isValid) throw new Error(reasonValidation.message);

  const requiredConfirmation = getDeletionConfirmationPhrase(order);
  if (String(confirmation || '').trim() !== requiredConfirmation) {
    throw new Error(`Type ${requiredConfirmation} exactly to permanently delete this order.`);
  }

  const orderRef = doc(db, 'orders', order.id);
  const auditRef = doc(db, 'recycleBinDeletionAudits', order.id);
  const batch = writeBatch(db);

  batch.set(auditRef, {
    orderId: order.id,
    action: 'permanently_deleted_from_recycle_bin',
    previousStatus: String(order.status || 'unknown'),
    actorUid,
    occurredAt: serverTimestamp(),
    reason: reasonValidation.reason,
    orderSnapshot: createDeletionOrderSnapshot(order),
  });
  batch.delete(orderRef);

  await batch.commit();
  return { auditId: auditRef.id };
};

const addRecycleBinDeletionWrites = ({ batch, order, actorUid, reason }) => {
  const auditRef = doc(db, 'recycleBinDeletionAudits', order.id);
  const orderRef = doc(db, 'orders', order.id);

  batch.set(auditRef, {
    orderId: order.id,
    action: 'permanently_deleted_from_recycle_bin',
    previousStatus: String(order.status || 'unknown'),
    actorUid,
    occurredAt: serverTimestamp(),
    reason,
    orderSnapshot: createDeletionOrderSnapshot(order),
  });
  batch.delete(orderRef);
};

const addActiveOrderDeletionWrites = ({ batch, order, actorUid, reason }) => {
  const auditRef = doc(db, 'activeOrderDeletionAudits', order.id);
  const orderRef = doc(db, 'orders', order.id);

  batch.set(auditRef, {
    orderId: order.id,
    action: 'permanently_deleted_from_active_orders',
    previousStatus: String(order.status || 'unknown'),
    actorUid,
    occurredAt: serverTimestamp(),
    reason,
    orderSnapshot: createDeletionOrderSnapshot(order),
  });
  batch.delete(orderRef);
};

export const permanentlyDeleteArchivedOrders = async ({ orders, actorUid, reason }) => {
  requireAdminActor(actorUid);

  const uniqueOrders = Array.from(new Map(
    (Array.isArray(orders) ? orders : []).map((order) => [order?.id, order]),
  ).values());

  if (uniqueOrders.length === 0) {
    throw new Error('Select at least one completed, cancelled, or declined order from the recycle bin.');
  }

  uniqueOrders.forEach((order) => {
    requireOrderId(order);
    requireArchivableStatus(order);
    if (!order.archive?.isArchived) {
      throw new Error('Only orders in the recycle bin can be permanently deleted.');
    }
  });

  const reasonValidation = validateLifecycleReason(reason);
  if (!reasonValidation.isValid) throw new Error(reasonValidation.message);

  let deletedCount = 0;
  for (let index = 0; index < uniqueOrders.length; index += BULK_ARCHIVE_CHUNK_SIZE) {
    const chunk = uniqueOrders.slice(index, index + BULK_ARCHIVE_CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((order) => addRecycleBinDeletionWrites({
      batch,
      order,
      actorUid,
      reason: reasonValidation.reason,
    }));

    try {
      await batch.commit();
      deletedCount += chunk.length;
    } catch (error) {
      const remainingCount = uniqueOrders.length - deletedCount;
      throw new Error(
        deletedCount > 0
          ? `${deletedCount} order${deletedCount === 1 ? '' : 's'} were permanently deleted. ${remainingCount} remaining order${remainingCount === 1 ? '' : 's'} could not be deleted.`
          : (error?.message || 'The selected orders could not be permanently deleted.'),
      );
    }
  }

  return { deletedCount };
};

export const permanentlyDeleteActiveOrders = async ({ orders, actorUid, reason }) => {
  requireAdminActor(actorUid);

  const uniqueOrders = Array.from(new Map(
    (Array.isArray(orders) ? orders : []).map((order) => [order?.id, order]),
  ).values());

  if (uniqueOrders.length === 0) {
    throw new Error('Select at least one completed, cancelled, or declined active order.');
  }

  uniqueOrders.forEach((order) => {
    requireOrderId(order);
    requireArchivableStatus(order);
    if (order.archive?.isArchived) {
      throw new Error('Orders in the recycle bin must use its permanent deletion workflow.');
    }
  });

  const reasonValidation = validateLifecycleReason(reason);
  if (!reasonValidation.isValid) throw new Error(reasonValidation.message);

  let deletedCount = 0;
  for (let index = 0; index < uniqueOrders.length; index += BULK_ARCHIVE_CHUNK_SIZE) {
    const chunk = uniqueOrders.slice(index, index + BULK_ARCHIVE_CHUNK_SIZE);
    const batch = writeBatch(db);
    chunk.forEach((order) => addActiveOrderDeletionWrites({
      batch,
      order,
      actorUid,
      reason: reasonValidation.reason,
    }));

    try {
      await batch.commit();
      deletedCount += chunk.length;
    } catch (error) {
      const remainingCount = uniqueOrders.length - deletedCount;
      throw new Error(
        deletedCount > 0
          ? `${deletedCount} order${deletedCount === 1 ? '' : 's'} were permanently deleted. ${remainingCount} remaining order${remainingCount === 1 ? '' : 's'} could not be deleted.`
          : (error?.message || 'The selected orders could not be permanently deleted.'),
      );
    }
  }

  return { deletedCount };
};
