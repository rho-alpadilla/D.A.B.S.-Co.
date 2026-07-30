import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test, { after, before, beforeEach } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

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
  await assertSucceeds(setDoc(doc(buyer, 'users', 'buyer-1'), { role: 'customer' }));
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

test('analytics event records are inaccessible to every browser client', async () => {
  const admin = asUser('admin-1', 'admin@example.com');
  await seedDocument('users/admin-1', { role: 'admin' });
  await seedDocument('analyticsEventLog/event-1', { processed: true });

  await assertFails(getDoc(doc(admin, 'analyticsEventLog', 'event-1')));
});
