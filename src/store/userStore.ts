import { create } from "zustand";
import { UserInfo } from "@/hooks/useUserInfo";

interface UserState {
  userInfo: UserInfo | null;
  setUserInfo: (user: UserInfo | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  setUserInfo: (user: UserInfo | null) => set({ userInfo: user }),
}));
