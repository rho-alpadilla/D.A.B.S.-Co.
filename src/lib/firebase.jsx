// src/lib/firebase.jsx   ← keep the .jsx extension!
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

const firebaseConfig = {
  apiKey: "AIzaSyDp5T9Kb5GdS3g0DjF24QQf7EzZFgI-_Ec",
  authDomain: "dabs-co.firebaseapp.com",
  projectId: "dabs-co",
  storageBucket: "dabs-co.firebasestorage.app",
  messagingSenderId: "967875796666",
  appId: "1:967875796666:web:1dfa4cdc291c08efa36c83",
  measurementId: "G-NPE0S9MBD6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Auth Context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);   // ← this now always runs
    });
    return unsubscribe;
  }, []);

  // ← REMOVED the blocking !loading check
  // We render children even during loading — your app appears instantly
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);