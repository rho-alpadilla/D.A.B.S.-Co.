import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test, { after, before, beforeEach } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

const projectId = 'dabs-rules-test';
let testEnvironment;

const asUser = (uid, email) =>
  testEnvironment.authenticatedContext(uid, { email }).firestore();

const seedDocument = async (path, data) => {
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data);
  });
};

before(async () => {
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
});

after(async () => {
  await testEnvironment.cleanup();
});

test('a buyer cannot create an admin profile, but can register their own customer profile', async () => {
  const buyer = asUser('buyer-1', 'buyer@example.com');

  await assertFails(setDoc(doc(buyer, 'users', 'buyer-1'), { role: 'admin' }));
  await assertSucceeds(setDoc(doc(buyer, 'users', 'buyer-1'), {
    role: 'customer',
    accountStatus: 'active',
    hasApprovedOrders: false,
  }));
});

test('an order owner cannot complete an order directly', async () => {
  const buyer = asUser('buyer-1', 'buyer@example.com');
  await seedDocument('users/buyer-1', { role: 'customer' });
  await seedDocument('orders/order-1', {
    buyerEmail: 'buyer@example.com',
    status: 'pending',
    total: 250,
  });

  await assertFails(updateDoc(doc(buyer, 'orders', 'order-1'), { status: 'completed' }));
});

test('an order owner can submit the existing cancellation request workflow', async () => {
  const buyer = asUser('buyer-1', 'buyer@example.com');
  await seedDocument('users/buyer-1', { role: 'customer' });
  await seedDocument('orders/order-1', {
    buyerEmail: 'buyer@example.com',
    status: 'on_review',
    total: 250,
  });

  await assertSucceeds(updateDoc(doc(buyer, 'orders', 'order-1'), {
    cancelReason: 'Changed my mind',
    cancellationRequestedBy: 'buyer',
    cancellationRequestedAt: new Date(),
    status: 'Cancellation Requested',
  }));
});

test('daily analytics are admin-readable and never browser-writable', async () => {
  const admin = asUser('admin-1', 'admin@example.com');
  const buyer = asUser('buyer-1', 'buyer@example.com');
  await seedDocument('users/admin-1', { role: 'admin' });
  await seedDocument('users/buyer-1', { role: 'customer' });
  await seedDocument('analyticsDaily/2026-07-24', { orderCount: 2 });

  await assertSucceeds(getDoc(doc(admin, 'analyticsDaily', '2026-07-24')));
  await assertFails(getDoc(doc(buyer, 'analyticsDaily', '2026-07-24')));
  await assertFails(setDoc(doc(admin, 'analyticsDaily', '2026-07-25'), { orderCount: 1 }));
});

test('a sub-admin can update only permitted order status fields', async () => {
  const subAdmin = asUser('artisan-1', 'artisan@example.com');
  await seedDocument('users/artisan-1', { role: 'sub-admin' });
  await seedDocument('orders/order-1', {
    buyerEmail: 'buyer@example.com',
    status: 'on_review',
    total: 250,
  });

  await assertSucceeds(updateDoc(doc(subAdmin, 'orders', 'order-1'), {
    status: 'processing',
    updatedAt: new Date(),
  }));
  await assertFails(updateDoc(doc(subAdmin, 'orders', 'order-1'), { total: 1 }));
});

test('a main admin can keep existing status workflows but cannot write archive fields early', async () => {
  const admin = asUser('admin-1', 'admin@example.com');
  await seedDocument('users/admin-1', { role: 'admin' });
  await seedDocument('orders/order-1', {
    buyerEmail: 'buyer@example.com',
    status: 'pending',
    total: 250,
  });

  await assertSucceeds(updateDoc(doc(admin, 'orders', 'order-1'), {
    status: 'on_review',
    reviewedAt: new Date(),
    updatedAt: new Date(),
  }));
  await assertFails(updateDoc(doc(admin, 'orders', 'order-1'), {
    'archive.isArchived': true,
  }));
});

test('a main admin can permanently delete only their reviewed incomplete record with an immutable audit batch', async () => {
  const admin = asUser('admin-1', 'admin@example.com');
  const reviewedAt = new Date();
  const orderRef = doc(admin, 'orders', 'invalid-order');
  const auditRef = doc(admin, 'orderDeletionAudits', 'invalid-order');
  await seedDocument('users/admin-1', { role: 'admin' });
  await seedDocument('orders/invalid-order', {
    buyerEmail: 'buyer@example.com',
    status: 'pending',
    total: 250,
    dataQualityReview: {
      reviewedBy: 'admin-1',
      reviewedAt,
    },
  });

  await assertFails(deleteDoc(orderRef));

  const batch = writeBatch(admin);
  batch.set(auditRef, {
    orderId: 'invalid-order',
    action: 'permanently_deleted',
    previousStatus: 'pending',
    actorUid: 'admin-1',
    occurredAt: serverTimestamp(),
    reason: 'Duplicate test record with incomplete historical data.',
    reviewedBy: 'admin-1',
    reviewedAt,
  });
  batch.delete(orderRef);
  await assertSucceeds(batch.commit());
  await assertSucceeds(getDoc(auditRef));
  await assertFails(deleteDoc(auditRef));
});

test('a main admin cannot delete a valid, unreviewed, or paid order', async () => {
  const admin = asUser('admin-1', 'admin@example.com');
  await seedDocument('users/admin-1', { role: 'admin' });
  await seedDocument('orders/valid-order', {
    buyerEmail: 'buyer@example.com',
    status: 'pending',
    total: 250,
    createdAt: new Date(),
    items: [{ id: 'product-1', quantity: 1, price: 250 }],
  });
  await seedDocument('orders/unreviewed-order', {
    buyerEmail: 'buyer@example.com',
    status: 'pending',
    total: 250,
  });
  await seedDocument('orders/paid-order', {
    buyerEmail: 'buyer@example.com',
    status: 'declined',
    total: 250,
    paidAt: new Date(),
    dataQualityReview: {
      reviewedBy: 'admin-1',
      reviewedAt: new Date(),
    },
  });

  await assertFails(deleteDoc(doc(admin, 'orders', 'valid-order')));
  await assertFails(deleteDoc(doc(admin, 'orders', 'unreviewed-order')));
  await assertFails(deleteDoc(doc(admin, 'orders', 'paid-order')));

  const paidAuditRef = doc(admin, 'orderDeletionAudits', 'paid-order');
  const paidOrderRef = doc(admin, 'orders', 'paid-order');
  const paidBatch = writeBatch(admin);
  paidBatch.set(paidAuditRef, {
    orderId: 'paid-order',
    action: 'permanently_deleted',
    previousStatus: 'declined',
    actorUid: 'admin-1',
    occurredAt: serverTimestamp(),
    reason: 'Attempt to remove a paid historical record.',
    reviewedBy: 'admin-1',
    reviewedAt: new Date(),
  });
  paidBatch.delete(paidOrderRef);
  await assertFails(paidBatch.commit());
});

test('only a main admin can record the one-time data-quality review', async () => {
  const admin = asUser('admin-1', 'admin@example.com');
  const subAdmin = asUser('artisan-1', 'artisan@example.com');
  await seedDocument('users/admin-1', { role: 'admin' });
  await seedDocument('users/artisan-1', { role: 'sub-admin' });
  await seedDocument('orders/order-1', {
    buyerEmail: 'buyer@example.com',
    status: 'pending',
    total: 250,
  });

  await assertFails(updateDoc(doc(subAdmin, 'orders', 'order-1'), {
    dataQualityReview: { reviewedBy: 'artisan-1', reviewedAt: serverTimestamp() },
    updatedAt: new Date(),
  }));
  await assertSucceeds(updateDoc(doc(admin, 'orders', 'order-1'), {
    dataQualityReview: { reviewedBy: 'admin-1', reviewedAt: serverTimestamp() },
    updatedAt: new Date(),
  }));
  await assertFails(updateDoc(doc(admin, 'orders', 'order-1'), {
    dataQualityReview: { reviewedBy: 'admin-1', reviewedAt: serverTimestamp() },
    updatedAt: new Date(),
  }));
});

test('a main admin can archive a terminal order only with a matching immutable audit batch', async () => {
  const admin = asUser('admin-1', 'admin@example.com');
  const orderRef = doc(admin, 'orders', 'order-1');
  await seedDocument('users/admin-1', { role: 'admin' });
  await seedDocument('orders/order-1', {
    buyerEmail: 'buyer@example.com',
    status: 'completed',
    total: 250,
    createdAt: new Date(),
    items: [{ id: 'product-1', quantity: 1, price: 250 }],
  });

  await assertFails(updateDoc(orderRef, {
    archive: {
      isArchived: true,
      archivedAt: serverTimestamp(),
      archivedBy: 'admin-1',
      reason: 'Historical cleanup for the completed order.',
      restoredAt: null,
      restoredBy: null,
      restoreReason: '',
      lastLifecycleAuditId: 'archive-audit',
    },
    updatedAt: serverTimestamp(),
  }));

  const auditRef = doc(admin, 'orderLifecycleAudits', 'archive-audit');
  const batch = writeBatch(admin);
  batch.set(auditRef, {
    orderId: 'order-1',
    action: 'archived',
    previousStatus: 'completed',
    actorUid: 'admin-1',
    occurredAt: serverTimestamp(),
    reason: 'Historical cleanup for the completed order.',
  });
  batch.update(orderRef, {
    archive: {
      isArchived: true,
      archivedAt: serverTimestamp(),
      archivedBy: 'admin-1',
      reason: 'Historical cleanup for the completed order.',
      restoredAt: null,
      restoredBy: null,
      restoreReason: '',
      lastLifecycleAuditId: 'archive-audit',
    },
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());

  await assertFails(updateDoc(auditRef, { reason: 'Changed later' }));
  await assertFails(deleteDoc(auditRef));
});

test('archive and lifecycle audits are denied to sub-admins', async () => {
  const subAdmin = asUser('artisan-1', 'artisan@example.com');
  const orderRef = doc(subAdmin, 'orders', 'order-1');
  await seedDocument('users/artisan-1', { role: 'sub-admin' });
  await seedDocument('orders/order-1', {
    buyerEmail: 'buyer@example.com',
    status: 'completed',
    total: 250,
    createdAt: new Date(),
    items: [{ id: 'product-1', quantity: 1, price: 250 }],
  });

  const auditRef = doc(subAdmin, 'orderLifecycleAudits', 'archive-audit');
  const batch = writeBatch(subAdmin);
  batch.set(auditRef, {
    orderId: 'order-1',
    action: 'archived',
    previousStatus: 'completed',
    actorUid: 'artisan-1',
    occurredAt: serverTimestamp(),
    reason: 'Historical cleanup for the completed order.',
  });
  batch.update(orderRef, {
    archive: {
      isArchived: true,
      archivedAt: serverTimestamp(),
      archivedBy: 'artisan-1',
      reason: 'Historical cleanup for the completed order.',
      restoredAt: null,
      restoredBy: null,
      restoreReason: '',
      lastLifecycleAuditId: 'archive-audit',
    },
    updatedAt: serverTimestamp(),
  });
  await assertFails(batch.commit());
});

test('a main admin can restore an archived terminal order only with a matching audit batch', async () => {
  const admin = asUser('admin-1', 'admin@example.com');
  const orderRef = doc(admin, 'orders', 'order-1');
  const archivedAt = new Date();
  await seedDocument('users/admin-1', { role: 'admin' });
  await seedDocument('orders/order-1', {
    buyerEmail: 'buyer@example.com',
    status: 'completed',
    total: 250,
    createdAt: new Date(),
    items: [{ id: 'product-1', quantity: 1, price: 250 }],
    archive: {
      isArchived: true,
      archivedAt,
      archivedBy: 'admin-1',
      reason: 'Historical cleanup for the completed order.',
      restoredAt: null,
      restoredBy: null,
      restoreReason: '',
      lastLifecycleAuditId: 'archive-audit',
    },
  });

  const auditRef = doc(admin, 'orderLifecycleAudits', 'restore-audit');
  const batch = writeBatch(admin);
  batch.set(auditRef, {
    orderId: 'order-1',
    action: 'restored',
    previousStatus: 'completed',
    actorUid: 'admin-1',
    occurredAt: serverTimestamp(),
    reason: 'Return this order to the operational history view.',
  });
  batch.update(orderRef, {
    archive: {
      isArchived: false,
      archivedAt,
      archivedBy: 'admin-1',
      reason: 'Historical cleanup for the completed order.',
      restoredAt: serverTimestamp(),
      restoredBy: 'admin-1',
      restoreReason: 'Return this order to the operational history view.',
      lastLifecycleAuditId: 'restore-audit',
    },
    updatedAt: serverTimestamp(),
  });
  await assertSucceeds(batch.commit());
});

test('order deletion audit records are immutable and cannot be created without deleting the matching reviewed invalid order', async () => {
  const admin = asUser('admin-1', 'admin@example.com');
  await seedDocument('users/admin-1', { role: 'admin' });

  await assertFails(setDoc(doc(admin, 'orderDeletionAudits', 'order-1'), {
    orderId: 'order-1',
    action: 'permanently_deleted',
    actorUid: 'admin-1',
    occurredAt: serverTimestamp(),
    reason: 'Invalid historical test record.',
  }));
});

test('analytics event records are inaccessible to every browser client', async () => {
  const admin = asUser('admin-1', 'admin@example.com');
  await seedDocument('users/admin-1', { role: 'admin' });
  await seedDocument('analyticsEventLog/event-1', { processed: true });

  await assertFails(getDoc(doc(admin, 'analyticsEventLog', 'event-1')));
});
