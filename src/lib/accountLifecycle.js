import {
  EmailAuthProvider,
  FacebookAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export const ACCOUNT_APPROVAL_STATUSES = new Set([
  'payment_confirmed',
  'processing',
  'shipping',
  'completed',
]);

export const hasApprovedPurchase = (orders = []) =>
  orders.some((order) => ACCOUNT_APPROVAL_STATUSES.has(order.status));

export const getAccountPurchaseSummary = async (email) => {
  if (!email) {
    return { hasApprovedPurchase: true, orders: [] };
  }

  const ordersSnapshot = await getDocs(
    query(collection(db, 'orders'), where('buyerEmail', '==', email))
  );
  const orders = ordersSnapshot.docs.map((order) => ({ id: order.id, ...order.data() }));

  return {
    hasApprovedPurchase: hasApprovedPurchase(orders),
    orders,
  };
};

export const getReauthenticationMethod = (user) => {
  const providerIds = user?.providerData?.map((provider) => provider.providerId) || [];

  if (providerIds.includes('password')) return 'password';
  if (providerIds.includes('google.com')) return 'google';
  if (providerIds.includes('facebook.com')) return 'facebook';

  return null;
};

export const reauthenticateAccount = async ({ user, password }) => {
  const method = getReauthenticationMethod(user);

  if (method === 'password') {
    if (!password) {
      throw new Error('Enter your password to continue.');
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    return;
  }

  if (method === 'google') {
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
    return;
  }

  if (method === 'facebook') {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    await reauthenticateWithPopup(user, provider);
    return;
  }

  throw new Error('This sign-in method cannot be reverified in the browser. Contact support for help.');
};

const clearUserSubcollection = async (uid, subcollectionName) => {
  const snapshot = await getDocs(collection(db, 'users', uid, subcollectionName));
  await Promise.all(snapshot.docs.map((entry) => deleteDoc(entry.ref)));
};

export const removeEligibleAccountData = async (uid) => {
  await Promise.all([
    clearUserSubcollection(uid, 'cart'),
    clearUserSubcollection(uid, 'notifications'),
  ]);
  await deleteDoc(doc(db, 'users', uid));
};

export const lockAccountAfterApprovedPurchase = async (order) => {
  if (!order?.buyerId) return;

  await updateDoc(doc(db, 'users', order.buyerId), {
    hasApprovedOrders: true,
    approvedOrderAt: serverTimestamp(),
  });
};

export const getAccountLifecycleErrorMessage = (error) => {
  switch (error?.code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'The password is incorrect.';
    case 'auth/popup-closed-by-user':
      return 'Verification was cancelled before it finished.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the verification window. Allow pop-ups and try again.';
    case 'auth/requires-recent-login':
      return 'Please sign in again, then retry this action.';
    default:
      return error?.message || 'We could not update your account. Please try again.';
  }
};

export const getCurrentAuthUser = () => auth.currentUser;
