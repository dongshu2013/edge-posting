"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DocumentDuplicateIcon,
  CheckIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/useAuth";

const serviceAddress =
  process.env.NEXT_PUBLIC_SERVICE_ADDRESS ||
  "0x000000000000000000000000000000000000dEaD";

const ADJECTIVES = [
  "Happy",
  "Lucky",
  "Clever",
  "Bright",
  "Swift",
  "Witty",
  "Brave",
  "Kind",
];
const NOUNS = [
  "Bee",
  "Buzz",
  "Honey",
  "Hive",
  "Worker",
  "Queen",
  "Garden",
  "Flower",
];

function generateRandomNickname(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective}${noun}${Math.floor(Math.random() * 1000)}`;
}

interface UserProfile {
  email: string | null;
  displayName: string | null;
  username: string | null;
  totalEarned: number;
  reputation: number;
  balance: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: "REWARD" | "BURN";
  status: "PENDING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  address: string;
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [nickname, setNickname] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/buzz");
      return;
    }

    // Load cached withdraw address
    const cachedAddress = localStorage.getItem("lastWithdrawAddress");
    if (cachedAddress) {
      setWithdrawAddress(cachedAddress);
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch profile data
        const profileResponse = await fetch(`/api/user/${params.address}`);
        const profileData = await profileResponse.json();
        setProfile(profileData);
        setNickname(profileData.username || "");

        // Fetch transactions
        const transactionsResponse = await fetch(
          `/api/user/${params.address}/transactions`
        );
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions ?? []);

        // Fetch withdrawals
        const withdrawalsResponse = await fetch(
          `/api/user/${params.address}/withdrawals`
        );
        const withdrawalsData = await withdrawalsResponse.json();
        setWithdrawals(withdrawalsData.withdrawals ?? []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.address, user, loading, router]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(serviceAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress || !withdrawAmount) return;

    try {
      localStorage.setItem("lastWithdrawAddress", withdrawAddress);
      const response = await fetch("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: withdrawAddress,
          amount: parseFloat(withdrawAmount),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to withdraw");
      }

      setShowWithdrawModal(false);
      router.refresh();
    } catch (error) {
      console.error("Error withdrawing:", error);
      setError(error instanceof Error ? error.message : "Failed to withdraw");
    }
  };

  const handleUpdateNickname = async () => {
    try {
      const response = await fetch(`/api/user/${user?.uid}/update-nikename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: nickname || generateRandomNickname(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update nickname");
      }

      setShowNicknameModal(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating nickname:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update nickname"
      );
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded-xl w-3/4" />
          <div className="h-10 bg-gray-200 rounded-xl w-1/2" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">
          Profile not found
        </h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-white text-lg font-medium">Total Balance</h2>
            <p className="text-4xl font-bold text-white mt-2">
              {(profile.balance || 0.0).toFixed(2)} BUZZ
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium"
            >
              Deposit
            </button>
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium"
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Profile Details
          </h1>
          <button
            onClick={() => setShowNicknameModal(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-1.5" />
            Edit Nickname
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Nickname</p>
            <p className="text-lg font-medium text-gray-900">
              {profile.username || "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-lg font-medium text-gray-900">
              {profile.email || "No email"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Earned</p>
            <p className="text-lg font-medium text-gray-900">
              {profile.totalEarned} BUZZ
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Reputation</p>
            <p className="text-lg font-medium text-gray-900">
              {profile.reputation} points
            </p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Payment History
        </h2>
        <div className="space-y-6">
          {/* Transactions */}
          {transactions?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {tx.type}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {tx.amount} BUZZ
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : tx.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Withdrawals */}
          {withdrawals?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Withdrawals
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                        Address
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {withdrawal.amount} BUZZ
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {`${withdrawal.address.slice(
                            0,
                            6
                          )}...${withdrawal.address.slice(-4)}`}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              withdrawal.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : withdrawal.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {transactions.length === 0 && withdrawals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payment history yet
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Deposit BUZZ Tokens</h3>
            <p className="text-sm text-gray-500 mb-4">
              Send BUZZ tokens to the following address:
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
              <code className="text-sm flex-1 break-all">{serviceAddress}</code>
              <button
                onClick={handleCopyAddress}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {copied ? (
                  <CheckIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <DocumentDuplicateIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            <button
              onClick={() => setShowDepositModal(false)}
              className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm bg-white hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Withdraw BUZZ Tokens</h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="withdrawAddress"
                  className="block text-sm font-medium text-gray-700"
                >
                  Wallet Address
                </label>
                <input
                  type="text"
                  id="withdrawAddress"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0x..."
                />
              </div>
              <div>
                <label
                  htmlFor="withdrawAmount"
                  className="block text-sm font-medium text-gray-700"
                >
                  Amount
                </label>
                <input
                  type="number"
                  id="withdrawAmount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="0.0"
                  min="0"
                  step="0.1"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-4">
                <button
                  onClick={handleWithdraw}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  Withdraw
                </button>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNicknameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Update Nickname</h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="nickname"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nickname
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Enter nickname"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-4">
                <button
                  onClick={handleUpdateNickname}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowNicknameModal(false)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
