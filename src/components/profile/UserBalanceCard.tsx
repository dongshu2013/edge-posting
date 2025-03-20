import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { UserBalance } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { formatEther } from "viem";

interface UserBalanceWithSelected extends UserBalance {
  selected: boolean;
}

export const UserBalanceCard = () => {
  const { userInfo } = useAuth();
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const userBalancesQuery = useQuery<UserBalance[]>({
    queryKey: ["userBalances", userInfo?.uid],
    queryFn: async () => {
      const resJson = await fetchApi(`/api/user/${userInfo?.uid}/balances`, {
        auth: true,
      });
      return resJson.balances || [];
    },
  });

  const handleTokenSelect = (id: string) => {
    setSelectedTokenIds((prev) =>
      prev.includes(id)
        ? prev.filter((tokenId) => tokenId !== id)
        : [...prev, id]
    );
  };

  const handleWithdraw = () => {
    const selectedTokens = userBalancesQuery.data?.filter((token) =>
      selectedTokenIds.includes(token.id)
    );
    if (!selectedTokens?.length) return;

    setIsWithdrawing(true);
    // Here you would implement your actual withdrawal logic
    console.log("Withdrawing tokens:", selectedTokens);
  };

  const selectedCount = selectedTokenIds.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Token Balances
      </h2>

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
              {formatEther(token.tokenAmountOnChain)}
            </p>
          </div>
        ))}
      </div>

      <button
        className={`w-full py-2.5 px-4 rounded-lg font-medium ${
          selectedCount > 0 && !isWithdrawing
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-200 text-gray-500 cursor-not-allowed"
        } transition-colors`}
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
