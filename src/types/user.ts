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