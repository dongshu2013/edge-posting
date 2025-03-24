"use client";

import { fetchApi } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { useEffect, useState } from "react";
import ReferralCodeModal from "./ReferralCodeModal";

export const UserInit = () => {
  const { userInfo } = useUserStore();
  const [isReferralCodeModalOpen, setIsReferralCodeModalOpen] = useState(false);

  useEffect(() => {
    console.log("userInfo", userInfo);
    (async () => {
      if (userInfo?.uid) {
        const resJson = await fetchApi("/api/referral/show-referral", {
          auth: true,
        });
        console.log(resJson);
        if (resJson?.showReferral) {
          setIsReferralCodeModalOpen(true);
        }
      }
    })();
  }, [userInfo?.uid]);

  return (
    <div>
      <ReferralCodeModal
        isOpen={isReferralCodeModalOpen}
        onClose={() => setIsReferralCodeModalOpen(false)}
      />
    </div>
  );
};
