"use client";

import { fetchApi } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { getSiweMessage } from "@/utils/evmUtils";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Copy, PencilIcon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAccount, useSignMessage } from "wagmi";

export const WalletCard = () => {
  const { userInfo, updateUserInfo } = useUserStore();
  const { address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();
  const [isBindingWallet, setIsBindingWallet] = useState(false);

  const handleBindWallet = async () => {
    if (!address) {
      openConnectModal?.();
      return;
    }

    try {
      setIsBindingWallet(true);
      const siweMessage = getSiweMessage(
        address,
        Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
      );
      const siweSignature =
        (await signMessageAsync({
          message: siweMessage,
        }).catch((err: any) => {
          console.log({ err });
        })) || null;

      if (!siweSignature) {
        throw new Error("Failed to sign message");
      }

      const resJson = await fetchApi(
        "/api/user/" + userInfo?.uid + "/bind-wallet",
        {
          method: "POST",
          body: JSON.stringify({
            siweMessage,
            siweSignature,
          }),
        }
      );

      if (resJson.error) {
        throw new Error(resJson.error);
      }

      updateUserInfo();
      toast.success("Wallet bound successfully");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsBindingWallet(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Wallet</h1>
        {!userInfo?.bindedWallet && (
          <button
            onClick={handleBindWallet}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-1.5" />
            Bind Wallet
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-gray-500">Binded Wallet</p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-medium text-gray-900">
              {userInfo?.bindedWallet || "N/A"}
            </p>
          {userInfo?.bindedWallet && (
            <Copy
              className="w-4 h-4 cursor-pointer text-gray-500"
              onClick={() => {
                navigator.clipboard.writeText(userInfo?.bindedWallet || "");
                toast.success("Copied");
              }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
