"use client";

import { CreateBuzzRequest } from "@/app/api/buzz/create/route";
import { BNB_COMMISSION_FEE } from "@/config/common";
import { fetchApi } from "@/lib/api";
import { getPublicClient } from "@/lib/ethereum";
import { useUserStore } from "@/store/userStore";
import { BoltIcon } from "@heroicons/react/24/outline";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, useSendTransaction, useWalletClient } from "wagmi";

export default function NewBuzzPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useWalletClient();
  const { sendTransactionAsync } = useSendTransaction();
  const userInfo = useUserStore((state) => state.userInfo);
  const [formData, setFormData] = useState({
    tweetLink: "",
    instructions: "",
    totalAmount: 0.1,
    deadline: 1,
    paymentToken: "BNB",
    customTokenAddress: "",
    paymentMethod: "in-app",
    transactionHash: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "totalAmount" ? parseFloat(value) : value,
    });
  };

  const handlePaymentMethodChange = (method: string) => {
    setFormData({
      ...formData,
      paymentMethod: method,
      transactionHash: method === "in-app" ? "" : formData.transactionHash,
    });
  };

  const handleInAppPayment = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    const publicClient = getPublicClient(
      Number(process.env.NEXT_PUBLIC_ETHEREUM_CHAIN_ID)
    );

    if (!publicClient || !walletClient) {
      alert("Client not found");
      return;
    }

    try {
      // TODO: Replace with CA
      const destinationAddress = process.env
        .NEXT_PUBLIC_BSC_CA as `0x${string}`;
      let txHash = "";
      if (formData.paymentToken === "BNB") {
        // Convert BNB amount to wei
        const amount =
          parseEther(formData.totalAmount.toString()) +
          parseEther(BNB_COMMISSION_FEE.toString());

        // Send transaction using viem/wagmi
        console.log("start sendTransactionAsync");
        const hash = await sendTransactionAsync({
          to: destinationAddress,
          value: amount,
          account: address,
        });
        console.log("hash", hash);

        // Wait for transaction receipt
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: hash,
        });

        console.log("receipt", receipt);

        if (receipt.status === "success") {
          txHash = hash;
        } else {
          throw new Error("Transaction failed");
        }
      }

      if (txHash) {
        // await createBuzzCampaign(txHash);
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      alert(
        error instanceof Error ? error.message : "Payment processing failed"
      );
    }
  };

  const createBuzzCampaign = async (txHash: string) => {
    if (!userInfo?.uid) {

      return;
    }
    const deadline = new Date();
    // deadline.setHours(deadline.getHours() + Number(formData.deadline));
    deadline.setMinutes(deadline.getMinutes() + 2);

    try {
      const payload: CreateBuzzRequest = {
        tweetLink: formData.tweetLink,
        instructions: formData.instructions,
        tokenAmount: formData.totalAmount,
        deadline: deadline.toISOString(),
        paymentToken: formData.paymentToken,
        customTokenAddress: formData.customTokenAddress,
        transactionHash: txHash,
      };
      const buzz = await fetchApi("/api/buzz/create", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!buzz) {
        throw new Error(buzz.error || "Failed to create buzz");
      }

      alert("Buzz created successfully!");

      router.push(`/buzz/${buzz.id}`);
    } catch (error) {
      console.error("Error creating buzz:", error);
      alert(error instanceof Error ? error.message : "Failed to create buzz");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.paymentMethod === "in-app") {
      await handleInAppPayment();
    } else {
      if (!formData.transactionHash || formData.transactionHash.trim() === "") {
        alert("Please enter a valid transaction hash");
        return;
      }

      await createBuzzCampaign(formData.transactionHash);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Create Your Buzz 🐝
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Let&apos;s make some noise in the meme-verse! 🚀
          </p>
        </div>

        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl bg-white/90 border border-gray-100">
          <div className="px-6 py-6 sm:p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="tweetLink"
                  className="block text-sm font-medium text-gray-700"
                >
                  Tweet URL 🔗
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="url"
                    name="tweetLink"
                    id="tweetLink"
                    className="block w-full pl-4 pr-20 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                    placeholder="https://twitter.com/..."
                    required
                    value={formData.tweetLink}
                    onChange={handleInputChange}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-r-xl">
                    <BoltIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="instructions"
                  className="block text-sm font-medium text-gray-700"
                >
                  Reply Instructions 📝
                </label>
                <textarea
                  name="instructions"
                  id="instructions"
                  rows={2}
                  className="block w-full px-4 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                  placeholder="Share context about your tweet and how we should reply to it"
                  required
                  value={formData.instructions}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="paymentToken"
                  className="block text-sm font-medium text-gray-700"
                >
                  Payment Token 💸
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    name="paymentToken"
                    id="paymentToken"
                    className="block w-full px-4 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                    value={formData.paymentToken}
                    onChange={handleInputChange}
                  >
                    <option value="BNB">BNB</option>
                    <option value="CUSTOM">Custom ERC20 Token</option>
                  </select>

                  {formData.paymentToken === "CUSTOM" && (
                    <div className="relative rounded-xl shadow-sm">
                      <input
                        type="text"
                        name="customTokenAddress"
                        id="customTokenAddress"
                        className="block w-full pl-4 pr-20 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                        placeholder="0x..."
                        value={formData.customTokenAddress}
                        onChange={handleInputChange}
                        required={formData.paymentToken === "CUSTOM"}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-green-500 to-green-600 text-white rounded-r-xl">
                        <span className="text-sm font-medium">ERC20</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 italic">
                  {formData.paymentToken === "BNB"
                    ? "Pay with BNB (default)"
                    : "Enter the contract address of your ERC20 token"}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="totalAmount"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Total Reward Amount 💰
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <input
                      type="number"
                      name="totalAmount"
                      id="totalAmount"
                      className="block w-full pl-4 pr-20 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                      placeholder="0.00"
                      step="0.01"
                      min="0.0001"
                      value={formData.totalAmount}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-r-xl">
                      <span className="text-sm font-medium">
                        {formData.paymentToken === "BNB" ? "BNB" : "Token"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    Total reward pool for all replies
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="deadline"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Expires in ⏰
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <input
                      type="number"
                      name="deadline"
                      id="deadline"
                      className="block w-full pl-4 pr-20 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                      placeholder="1"
                      min="1"
                      value={formData.deadline}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-r-xl">
                      <span className="text-sm font-medium">hours</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method 💳
                </label>
                <div className="flex flex-col space-y-4">
                  <div className="flex rounded-xl overflow-hidden border border-gray-200">
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
                        formData.paymentMethod === "in-app"
                          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => handlePaymentMethodChange("in-app")}
                    >
                      Pay In-App
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-3 px-4 text-center text-sm font-medium ${
                        formData.paymentMethod === "manual"
                          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => handlePaymentMethodChange("manual")}
                    >
                      Manual TX Hash
                    </button>
                  </div>

                  {formData.paymentMethod === "manual" && (
                    <div className="space-y-2">
                      <label
                        htmlFor="transactionHash"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Transaction Hash
                      </label>
                      <div className="relative rounded-xl shadow-sm">
                        <input
                          type="text"
                          name="transactionHash"
                          id="transactionHash"
                          className="block w-full pl-4 pr-20 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                          placeholder="0x..."
                          value={formData.transactionHash}
                          onChange={handleInputChange}
                          required={formData.paymentMethod === "manual"}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-r-xl">
                          <span className="text-sm font-medium">TX</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        Enter the hash of your payment transaction
                      </p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Total Payment Required:
                      </span>

                      <div className="flex flex-col items-end">
                        <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
                          {formData.totalAmount}{" "}
                          {formData.paymentToken === "BNB" ? "BNB" : "Tokens"}
                        </span>

                        <span className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
                          + {BNB_COMMISSION_FEE} BNB
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  {formData.paymentMethod === "in-app"
                    ? "Pay & Create Buzz Campaign 🚀"
                    : "Create Buzz Campaign 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
