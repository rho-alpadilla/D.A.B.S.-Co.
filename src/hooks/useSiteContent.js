import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DEFAULT_SITE_CONTENT, normalizeSiteContent } from '@/data/siteContent';

export const useSiteContent = () => {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'siteContent'),
      (snapshot) => {
        setContent(normalizeSiteContent(snapshot.exists() ? snapshot.data() : {}));
        setLoading(false);
        setError('');
      },
      (snapshotError) => {
        console.error('Unable to load approved site content', snapshotError);
        setContent(DEFAULT_SITE_CONTENT);
        setLoading(false);
        setError('The latest approved content could not be loaded. Default content is shown.');
      },
    );

    return unsubscribe;
  }, []);

  return { content, loading, error };
};

export default useSiteContent;
