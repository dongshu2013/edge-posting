"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { PaymentModal } from "@/components/PaymentModal";
import { paymentServiceApplicationId } from "@/config";
import { useQuery } from "@tanstack/react-query";
import { paymentServiceUrl } from "@/config";
import FaucetModal from "@/components/FaucetModal";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";
import ProfileEditModal from "@/components/ProfileEditModal";

interface UserProfile {
  email: string | null;
  displayName: string | null;
  username: string | null;
  totalEarned: number;
  balance: number;
  nickname?: string;
  bio: string | null;
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
  const userInfo = useUserStore((state) => state.userInfo);
  const setUserInfo = useUserStore((state) => state.setUserInfo);
  const params = useParams();
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [username, setUserName] = useState("");
  const [, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("deposits");
  const [showFaucetModal, setShowFaucetModal] = useState(false);
  const userOrdersQuery = useQuery({
    queryKey: ["payment-user-orders", userInfo?.uid],
    enabled: !!userInfo?.uid,
    queryFn: async () => {
      const resJson = await fetch(
        `${paymentServiceUrl}/user-orders?payerId=${userInfo?.uid}&applicationId=${paymentServiceApplicationId}`
      ).then((res) => res.json());

      return resJson?.data?.orders || [];
    },
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch profile data
      console.log("Fetching profile data for:", params?.uid);
      const profileResponse = await fetchApi(`/api/user/${params?.uid}`, {
        auth: true,
      });
      console.log("Profile response:", profileResponse);

      if (profileResponse) {
        setProfile(profileResponse);
        setUserName(profileResponse.username || "");
      }

      try {
        // Fetch transactions
        const transactionsResponse = await fetchApi(
          `/api/user/${params.uid}/transactions`,
          { auth: true }
        );
        setTransactions(transactionsResponse.transactions || []);
      } catch (txError) {
        console.error("Error fetching transactions:", txError);
        // Don't fail the entire profile load if transactions fail
      }

      try {
        // Fetch withdrawals
        const withdrawalsResponse = await fetchApi(
          `/api/user/${params.uid}/withdrawals`,
          { auth: true }
        );
        setWithdrawals(withdrawalsResponse.withdrawals || []);
      } catch (wdError) {
        console.error("Error fetching withdrawals:", wdError);
        // Don't fail the entire profile load if withdrawals fail
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setError("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  }, [params.uid]);

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.push("/buzz");
      return;
    }

    // Load cached withdraw address
    const cachedAddress = localStorage.getItem("lastWithdrawAddress");
    if (cachedAddress) {
      setWithdrawAddress(cachedAddress);
    }

    fetchData();
  }, [isAuthenticated, loading, router, params.uid, fetchData]);

  const handleWithdraw = async () => {
    if (!withdrawAddress || !withdrawAmount || withdrawLoading) return;

    try {
      setWithdrawLoading(true);
      localStorage.setItem("lastWithdrawAddress", withdrawAddress);
      const resJson = await fetchApi("/api/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: withdrawAddress,
          amount: parseFloat(withdrawAmount),
        }),
      });

      if (!resJson) {
        setError("Failed to withdraw");
        return;
      }

      setShowWithdrawModal(false);
      fetchData();
    } catch (error) {
      console.error("Error withdrawing:", error);
      setError(error instanceof Error ? error.message : "Failed to withdraw");
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    if (!userInfo || !userInfo.uid) {
      setError("You must be logged in to update your username");
      return;
    }

    try {
      setError(null);
      const response = await fetchApi(
        `/api/user/${userInfo.uid}/update-username`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
          }),
          auth: true, // Explicitly set auth to true
        }
      );

      console.log("Update username response:", response);

      if (response) {
        if (userInfo) {
          setUserInfo({
            ...userInfo,
            username,
          });
        }

        // Update the profile state
        if (profile) {
          setProfile({
            ...profile,
            username,
          });
        }
        setShowUsernameModal(false);
        setError(null);
        alert("Username updated successfully!");
        // window.location.reload();
      }
    } catch (error) {
      console.error("Error updating username:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update username"
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
            <span
              className="self-center underline text-white cursor-pointer"
              onClick={() => {
                setShowFaucetModal(true);
              }}
            >
              Request Faucet
            </span>

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
            onClick={() => setShowUsernameModal(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="h-4 w-4 mr-1.5" />
            Edit Username
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500">Username</p>
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
          <div className="col-span-2">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Bio</p>
                <p className="text-lg font-medium text-gray-900">
                  {profile.bio || "No bio"}
                </p>
              </div>
              <button
                onClick={() => setShowProfileEditModal(true)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 h-fit"
              >
                <PencilIcon className="h-4 w-4 mr-1.5" />
                Edit Profile
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">My Referral Code</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-medium text-gray-900">
                {userInfo?.uid}
              </p>
              <Copy
                className="w-4 h-4 cursor-pointer text-gray-500"
                onClick={() => {
                  navigator.clipboard.writeText(userInfo?.uid || "");
                  toast.success("Copied");
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
        initialBio={profile.bio}
        onSubmit={async ({ bio }) => {
          try {
            const response = await fetchApi(
              `/api/user/${userInfo?.uid}/update-bio`,
              {
                method: "POST",
                body: JSON.stringify({ bio }),
                auth: true,
              }
            );

            if (response) {
              setProfile({
                ...profile,
                bio,
              });
              if (userInfo) {
                setUserInfo({
                  ...userInfo,
                  bio,
                });
              }
              toast.success("Bio updated successfully!");
            }
          } catch (error) {
            console.error("Error updating bio:", error);
            toast.error("Failed to update bio");
          }
        }}
      />

      {/* Payment History */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Payment History
        </h2>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("deposits")}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "deposits"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Deposits
            </button>
            <button
              onClick={() => setActiveTab("withdrawals")}
              className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "withdrawals"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Withdrawals
            </button>
          </nav>
        </div>

        <div className="space-y-6">
          {/* Deposits Tab */}
          {activeTab === "deposits" && (
            <div>
              {userOrdersQuery.data?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                          Order ID
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userOrdersQuery.data?.map(
                        (order: {
                          id: string;
                          transfer_amount_on_chain: string;
                          status: number;
                        }) => (
                          <tr key={order.id}>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {order.id}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {Number(order.transfer_amount_on_chain) /
                                Math.pow(10, 6)}{" "}
                              BUZZ
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  order.status === 0
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {order.status === 0 ? "Ongoing" : "Completed"}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No deposit history yet
                </div>
              )}
            </div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === "withdrawals" && (
            <div>
              {withdrawals?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                          Address
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {withdrawals.map((withdrawal) => (
                        <tr key={withdrawal.id}>
                          <td className="px-4 py-3 text-sm text-gray-900 text-left">
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
                          <td className="px-4 py-3 text-right text-sm text-gray-500">
                            {new Date(
                              withdrawal.createdAt
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No withdrawal history yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={showDepositModal}
        onClose={() => {
          setShowDepositModal(false);
        }}
        onSuccess={() => {
          setShowDepositModal(false);
          fetchData();
        }}
      />

      <FaucetModal
        isOpen={showFaucetModal}
        onClose={() => {
          setShowFaucetModal(false);
        }}
      />

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
                  disabled
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
                  disabled
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
              <p className="text-sm text-red-600">
                Withdrawal will be enabled after production release.
              </p>
              <div className="flex gap-4">
                <button
                  disabled={withdrawLoading}
                  onClick={handleWithdraw}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  {withdrawLoading ? "Withdrawing..." : "Withdraw"}
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

      {/* Nickname Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">Update Username</h2>

            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowUsernameModal(false);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUsername}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
