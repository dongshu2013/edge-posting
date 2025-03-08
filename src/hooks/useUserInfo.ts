import { useState, useEffect } from 'react';
import { adminAuth } from '@/lib/firebase-admin';
import { fetchApi } from '@/lib/api';

interface UserInfo {
  email: string | null;
  displayName: string | null;
}

export function useUserInfo(uid: string) {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchApi(`/api/user/${uid}`);
        setUserInfo(data);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user info');
      } finally {
        setLoading(false);
      }
    };

    if (uid) {
      fetchUserInfo();
    }
  }, [uid]);

  return { userInfo, loading, error };
} 