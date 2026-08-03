import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');

const providerByName = {
  google: googleProvider,
  facebook: facebookProvider,
};

export const getAuthenticationErrorMessage = (error) => {
  switch (error?.code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before authentication finished.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in window. Allow pop-ups and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email. Use its original sign-in method.';
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled yet. Please use email and password for now.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for the selected sign-in provider.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/user-not-found':
      return 'The email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait before trying again.';
    case 'dabs/account-deactivated':
      return 'This account has been deactivated. Contact an administrator to request reactivation.';
    default:
      return 'We could not complete authentication. Please try again.';
  }
};

const ensureSocialProfile = async (user) => {
  if (!user?.uid || !user.email) {
    throw new Error('The selected account did not provide an email address. Please use email and password instead.');
  }

  const userRef = doc(db, 'users', user.uid);
  const existingProfile = await getDoc(userRef);

  if (existingProfile.exists()) {
    const existingData = existingProfile.data();
    if (existingData.accountStatus === 'deactivated') {
      await signOut(auth);
      const error = new Error('This account has been deactivated. Contact an administrator to request reactivation.');
      error.code = 'dabs/account-deactivated';
      throw error;
    }

    return { isNewProfile: false, profile: existingData };
  }

  const username = user.email.split('@')[0];
  await setDoc(userRef, {
    fullName: user.displayName || username,
    username,
    email: user.email,
    displayName: user.displayName || username,
    photoURL: user.photoURL || '',
    role: 'customer',
    accountStatus: 'active',
    hasApprovedOrders: false,
    profileCompleted: false,
    createdAt: serverTimestamp(),
    addresses: [],
  });

  return { isNewProfile: true, profile: null };
};

export const signInWithSocialProvider = async (providerName) => {
  const provider = providerByName[providerName];
  if (!provider) throw new Error('Unsupported sign-in provider.');

  const result = await signInWithPopup(auth, provider);
  const profileResult = await ensureSocialProfile(result.user);
  return { user: result.user, ...profileResult };
};

export const assertAccountCanSignIn = async (user) => {
  if (!user?.uid) return;

  const profileSnapshot = await getDoc(doc(db, 'users', user.uid));
  if (profileSnapshot.exists() && profileSnapshot.data().accountStatus === 'deactivated') {
    const error = new Error('This account has been deactivated. Contact an administrator to request reactivation.');
    error.code = 'dabs/account-deactivated';
    throw error;
  }
};
