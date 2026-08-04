import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, useAuth } from '@/lib/firebase';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return undefined;

    if (!user?.uid) {
      setRole(null);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        setRole(snapshot.data()?.role || null);
        setLoading(false);
      },
      () => {
        setRole(null);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [authLoading, user?.uid]);

  const isAdmin = role === 'admin';
  const isSubAdmin = role === 'sub-admin';

  return {
    role,
    loading: authLoading || loading,
    isAdmin,
    isSubAdmin,
    isProductManager: isAdmin || isSubAdmin,
  };
}
