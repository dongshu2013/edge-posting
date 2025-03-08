import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/api";

export interface UserInfo {
  uid: string;
  email: string | null;
  username: string | null;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  totalEarned: number;
  balance: number;
  createdAt: Date;
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
        console.error("Error fetching user info:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch user info"
        );
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
