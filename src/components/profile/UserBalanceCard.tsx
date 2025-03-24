import { WithdrawRequest } from "@/app/api/withdraw/route";
import { contractAbi } from "@/config/contractAbi";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { getPublicClient } from "@/lib/ethereum";
import { UserWithdrawRequest, WithdrawSignatureResult } from "@/types/user";
import { getUserIdInt } from "@/utils/commonUtils";
import { fetchTransactionReceipt } from "@/utils/evmUtils";
import { formatChainAmount } from "@/utils/numberUtils";
import { UserBalance } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { formatEther } from "viem";
import { useWriteContract } from "wagmi";

interface UserBalanceWithSelected extends UserBalance {
  selected: boolean;
}

export const UserBalanceCard = () => {
  const { userInfo } = useAuth();
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [isContinuing, setIsContinuing] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const userBalancesQuery = useQuery<UserBalance[]>({
    queryKey: ["userBalances", userInfo?.uid],
    queryFn: async () => {
      const resJson = await fetchApi(`/api/user/${userInfo?.uid}/balances`, {
        auth: true,
      });
      return resJson.balances || [];
    },
  });

  const onGoingWithdrawRequestQuery = useQuery<UserWithdrawRequest | null>({
    queryKey: ["onGoingWithdrawRequest", userInfo?.uid],
    queryFn: async () => {
      const resJson = await fetchApi(`/api/withdraw/on-going`, { auth: true });
      return resJson.withdrawRequest || null;
    },
  });

  console.log("onGoingWithdrawRequestQuery", onGoingWithdrawRequestQuery.data);

  const handleContinueWithdraw = async () => {
    try {
      setIsContinuing(true);
      const resJson = await fetchApi("/api/withdraw/continue", {
        method: "POST",
        auth: true,
      });

      if (!resJson.result) {
        throw new Error(resJson.error);
      }

      await onGoingWithdrawRequestQuery.refetch();
      await userBalancesQuery.refetch();
      sendWithdrawTx(resJson.result);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsContinuing(false);
    }
  };

  const handleDiscardWithdraw = async () => {
    try {
      setIsDiscarding(true);
      const resJson = await fetchApi("/api/withdraw/discard", {
        method: "POST",
        auth: true,
      });

      if (resJson.error) {
        throw new Error(resJson.error);
      }

      toast.success("Withdrawal request discarded");
      await onGoingWithdrawRequestQuery.refetch();
      await userBalancesQuery.refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDiscarding(false);
    }
  };

  const handleTokenSelect = (id: string) => {
    if (onGoingWithdrawRequestQuery.data) {
      return;
    }
    const token = userBalancesQuery.data?.find((token) => token.id === id);
    if (!token) {
      return;
    }

    if (BigInt(token.tokenAmountOnChain) <= BigInt(0)) {
      setSelectedTokenIds((prev) => prev.filter((tokenId) => tokenId !== id));
      return;
    }

    setSelectedTokenIds((prev) =>
      prev.includes(id)
        ? prev.filter((tokenId) => tokenId !== id)
        : [...prev, id]
    );
  };

  const handleWithdraw = async () => {
    if (!userInfo?.bindedWallet) {
      toast.error("Please bind your wallet first");
      return;
    }
    const selectedTokens = userBalancesQuery.data?.filter((token) =>
      selectedTokenIds.includes(token.id)
    );
    if (!selectedTokens?.length) return;

    try {
      setIsWithdrawing(true);

      const payload: WithdrawRequest = {
        tokens: selectedTokens.map((token) => ({
          tokenAddress: token.tokenAddress,
        })),
      };

      const resJson = await fetchApi("/api/withdraw", {
        method: "POST",
        body: JSON.stringify(payload),
        auth: true,
      });

      if (resJson.result) {
        setSelectedTokenIds([]);
        await userBalancesQuery.refetch();
        await onGoingWithdrawRequestQuery.refetch();

        sendWithdrawTx(resJson.result);
      } else {
        throw new Error(resJson.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const sendWithdrawTx = async (request: WithdrawSignatureResult) => {
    if (!userInfo?.uid) {
      toast.error("Please login first");
      return;
    }
    try {
      const {
        tokenAddresses,
        tokenAmountsOnChain,
        recipient,
        expirationBlock,
        signature,
      } = request;
      const userIdInt = await getUserIdInt(userInfo?.uid);

      // Log the parameters for debugging
      console.log("Withdraw tx parameters:", {
        tokenAddresses,
        tokenAmountsOnChain: tokenAmountsOnChain.map((amount) =>
          amount.toString()
        ),
        userIdInt: userIdInt.toString(),
        recipient,
        expirationBlock,
        signatureLength: signature.length,
        signature,
      });

      try {
        const tx = await writeContractAsync({
          address: process.env.NEXT_PUBLIC_BSC_CA as `0x${string}`,
          abi: contractAbi,
          functionName: "withdraw",
          args: [
            tokenAddresses,
            tokenAmountsOnChain.map((amount: string) => BigInt(amount)),
            userIdInt,
            recipient,
            BigInt(expirationBlock),
            signature,
          ],
        });

        const publicClient = getPublicClient(
          Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
        );
        const receipt = await fetchTransactionReceipt(publicClient, tx);
        if (receipt?.status === "success") {
          toast.success("Withdrawal successful");
        } else {
          toast.error("Withdrawal failed: Transaction reverted");
        }
      } catch (txError: any) {
        console.error("Transaction error:", txError);
        
        // Extract detailed error message if available
        let errorMessage = "Withdrawal failed";
        
        if (txError.message) {
          errorMessage += `: ${txError.message}`;
        }
        
        // Check for rejection reason in the error
        if (txError.cause?.reason) {
          errorMessage += ` - ${txError.cause.reason}`;
        }
        
        // Check for data in the error that might contain the revert reason
        if (txError.data) {
          errorMessage += ` - ${JSON.stringify(txError.data)}`;
        }
        
        // Check for Solidity custom errors in the details
        if (txError.details) {
          errorMessage += ` - ${txError.details}`;
        }

        toast.error(errorMessage);
      }
    } catch (err: any) {
      console.error("Outer error:", err);
      toast.error(`Withdrawal preparation failed: ${err.message || "Unknown error"}`);
    }
  };

  const selectedCount = selectedTokenIds.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Token Balances
      </h2>

      {onGoingWithdrawRequestQuery.data && (
        <div className="mb-6 p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
          <p className="text-sm text-gray-700 mb-3">
            Withdrawal in progress:{" "}
            {onGoingWithdrawRequestQuery.data.tokenAddresses.length} tokens
          </p>

          <div className="flex space-x-3">
            <button
              onClick={handleContinueWithdraw}
              disabled={isContinuing}
              className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isContinuing ? "Processing..." : "Continue"}
            </button>
            <button
              onClick={handleDiscardWithdraw}
              disabled={isDiscarding}
              className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-sm font-semibold text-white shadow-sm hover:from-red-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDiscarding ? "Processing..." : "Discard"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {userBalancesQuery.data?.map((token) => (
          <div
            key={token.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${
              selectedTokenIds.includes(token.id)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200"
            } cursor-pointer transition-colors`}
            onClick={() => handleTokenSelect(token.id)}
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedTokenIds.includes(token.id)}
                onChange={() => {}}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />

              <div className="ml-3">
                <p className="font-medium text-gray-800">{token.tokenName}</p>
                <p className="text-sm text-gray-500">{token.tokenAddress}</p>
              </div>
            </div>

            <p className="font-medium text-gray-900">
              <span className="opacity-40">Available Balance:</span>{" "}
              {formatChainAmount(token.tokenAmountOnChain, token.tokenDecimals)}
            </p>
          </div>
        ))}
      </div>

      <button
        className={`w-full py-2.5 px-4 rounded-xl font-semibold ${
          selectedCount > 0 && !isWithdrawing
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        disabled={selectedCount === 0 || isWithdrawing}
        onClick={handleWithdraw}
      >
        {isWithdrawing
          ? "Processing..."
          : selectedCount > 0
          ? `Withdraw ${selectedCount} Selected Token${
              selectedCount > 1 ? "s" : ""
            }`
          : "Select Tokens to Withdraw"}
      </button>
    </div>
  );
};
