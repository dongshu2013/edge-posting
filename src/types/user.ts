export interface UserInfo {
  uid: string;
  email: string | null;
  username: string | null;
  nickname: string | null;
  avatar: string | null;
  bio: string | null;
  mood: string | null;
  totalEarned: number;
  balance: number;
  createdAt: Date;
  bindedWallet: string | null;
  twitterUsername: string | null;
}

export interface UserWithdrawRequest {
  id: string;
  userId: string;
  tokenAddresses: string[];
  tokenAmountsOnChain: string[];
}

export interface WithdrawSignatureResult {
  expirationBlock: string;
  tokenAddresses: `0x${string}`[];
  tokenAmountsOnChain: string[];
  recipient: `0x${string}`;
  signature: `0x${string}`;
}
