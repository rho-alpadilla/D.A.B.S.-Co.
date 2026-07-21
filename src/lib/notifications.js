import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const createNotification = async ({
  uid,
  type,
  title,
  body,
  link = '/',
  orderId = null,
  subject = null,
}) => {
  console.log('DABS NOTIF TEST 777', uid);

  if (!uid) {
    console.log('No uid provided. Notification skipped.');
    return;
  }

  try {
    const ref = await addDoc(collection(db, 'users', uid, 'notifications'), {
      type: type || 'general',
      title: title || 'New Notification',
      body: body || '',
      link,
      orderId,
      subject,
      read: false,
      createdAt: serverTimestamp(),
    });

    console.log('Notification created successfully:', ref.id);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export const createNotificationsForUsers = async ({
  uids = [],
  type,
  title,
  body,
  link = '/',
  orderId = null,
  subject = null,
}) => {
  const validUids = [...new Set(uids.filter(Boolean))];
  if (!validUids.length) return;

  await Promise.all(
    validUids.map((uid) =>
      createNotification({
        uid,
        type,
        title,
        body,
        link,
        orderId,
        subject,
      })
    )
  );
};