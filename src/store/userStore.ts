import { create } from "zustand";
import { UserInfo } from "@/types/user";
import { fetchApi } from "@/lib/api";

interface UserState {
  userInfo: UserInfo | null;
  setUserInfo: (user: UserInfo | null) => void;
  updateUserInfo: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  userInfo: null,
  setUserInfo: (user: UserInfo | null) => set({ userInfo: user }),
  updateUserInfo: async () => {
    const user = useUserStore.getState().userInfo;
    if (!user) return;
    const response = await fetchApi(`/api/user/${user.uid}`, {
      method: "GET",
      auth: true,
    }).catch((err) => {
      console.error("Error fetching user info from database:", err);
      return null;
    });
    if (response) {
      set({ userInfo: response });
    }
  },
}));
