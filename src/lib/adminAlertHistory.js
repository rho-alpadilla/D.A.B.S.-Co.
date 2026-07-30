import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const ADMIN_ALERT_SCOPE = 'admin-alert';

const SOURCE_PAGE_SIZE = 100;
const WRITE_BATCH_SIZE = 400;

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const createOrderAlert = (order) => ({
  id: `admin-order-${order.id}`,
  alertType: 'order',
  scope: ADMIN_ALERT_SCOPE,
  sourceId: order.id,
  title: 'New Order Received',
  body: `Order #${order.id.slice(0, 8)} from ${
    order.buyerEmail || order.buyerName || 'a buyer'
  }.`,
  link: '/admin-panel',
  createdAt: order.createdAt,
  sourceCreatedAt: order.createdAt,
});

const createMessageAlert = (message) => ({
  id: `admin-message-${message.id}`,
  alertType: 'message',
  scope: ADMIN_ALERT_SCOPE,
  sourceId: message.id,
  title: 'New Customer Message',
  body: `${message.buyerName || message.buyerEmail || 'A customer'} sent a message in "${
    message.subject || 'General Support'
  }".`,
  link: '/message-center',
  createdAt: message.createdAt,
  sourceCreatedAt: message.createdAt,
});

const writeAlertBatch = async ({ uid, alerts, read }) => {
  for (let index = 0; index < alerts.length; index += WRITE_BATCH_SIZE) {
    const batch = writeBatch(db);

    alerts.slice(index, index + WRITE_BATCH_SIZE).forEach((alert) => {
      batch.set(
        doc(db, 'users', uid, 'notifications', alert.id),
        {
          ...alert,
          read,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  }
};

const readSourceAlerts = async ({
  collectionName,
  createAlert,
  clearedAt,
  shouldInclude = () => true,
}) => {
  const alerts = [];
  let cursor = null;
  const clearedAtMillis = toMillis(clearedAt);

  do {
    const constraints = [orderBy('createdAt', 'desc'), limit(SOURCE_PAGE_SIZE)];
    if (cursor) constraints.splice(1, 0, startAfter(cursor));

    const snapshot = await getDocs(query(collection(db, collectionName), ...constraints));
    snapshot.docs.forEach((sourceDoc) => {
      const source = { id: sourceDoc.id, ...sourceDoc.data() };
      if (shouldInclude(source) && toMillis(source.createdAt) > clearedAtMillis) {
        alerts.push(createAlert(source));
      }
    });

    cursor = snapshot.docs.at(-1) || null;
    if (snapshot.size < SOURCE_PAGE_SIZE) break;
  } while (cursor);

  return alerts;
};

export const backfillAdminAlertHistory = async ({ uid, clearedAt = null }) => {
  const [orderAlerts, messageAlerts] = await Promise.all([
    readSourceAlerts({
      collectionName: 'orders',
      createAlert: createOrderAlert,
      clearedAt,
    }),
    readSourceAlerts({
      collectionName: 'messages',
      createAlert: createMessageAlert,
      clearedAt,
      shouldInclude: (message) => message.isAdminReply === false,
    }),
  ]);

  const alerts = [...orderAlerts, ...messageAlerts];
  await writeAlertBatch({ uid, alerts, read: true });

  await updateDoc(doc(db, 'users', uid), {
    adminAlertHistoryBackfilledAt: serverTimestamp(),
  });

  return alerts.length;
};

export const persistNewAdminAlert = async ({ uid, alert, clearedAt = null }) => {
  if (!alert || toMillis(alert.createdAt) <= toMillis(clearedAt)) return;

  await setDoc(
    doc(db, 'users', uid, 'notifications', alert.id),
    {
      ...alert,
      read: false,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const clearAdminAlertHistory = async (uid) => {
  const notificationsRef = collection(db, 'users', uid, 'notifications');

  while (true) {
    const snapshot = await getDocs(
      query(
        notificationsRef,
        where('scope', '==', ADMIN_ALERT_SCOPE),
        limit(WRITE_BATCH_SIZE)
      )
    );

    if (snapshot.empty) break;

    const batch = writeBatch(db);
    snapshot.docs.forEach((notificationDoc) => batch.delete(notificationDoc.ref));
    await batch.commit();
  }

  await updateDoc(doc(db, 'users', uid), {
    adminAlertsClearedAt: serverTimestamp(),
  });
};

export const createLiveOrderAlert = createOrderAlert;
export const createLiveMessageAlert = createMessageAlert;
