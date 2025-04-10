"use client";

import { CreateBuzzRequest } from "@/app/api/buzz/create/route";
import { BNB_COMMISSION_FEE } from "@/config/common";
import { fetchApi } from "@/lib/api";
import { getPublicClient } from "@/lib/ethereum";
import { useUserStore } from "@/store/userStore";
import { getTokenMetadata } from "@/utils/evmUtils";
import { BoltIcon } from "@heroicons/react/24/outline";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { erc20Abi, parseEther } from "viem";
import * as math from "mathjs";
import {
  useAccount,
  useSendTransaction,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { contractAbi } from "@/config/contractAbi";
import TransactionLoadingModal from "@/components/TransactionLoadingModal";
import toast from "react-hot-toast";
import { TermsModal } from "@/components/TermsModal";
import { Slider } from "@mui/material";

export default function NewBuzzPage() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { data: walletClient } = useWalletClient();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
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
    rewardSettleType: "default",
    maxParticipants: 10,
    minimumTokenAmount: 0,
  });
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<
    "pending" | "success" | "error"
  >("pending");
  const [transactionTitle, setTransactionTitle] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [isCreatingBuzz, setIsCreatingBuzz] = useState(false);

  const [shareOfKols, setShareOfKols] = useState("50");
  const [shareOfHolders, setShareOfHolders] = useState("40");
  const [shareOfOthers, setShareOfOthers] = useState("10");

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

  const handleRewardSettleTypeChange = (type: string) => {
    setFormData({
      ...formData,
      rewardSettleType: type,
    });
  };

  const handleInAppPayment = async () => {
    if (Number(formData.totalAmount) <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }

    if (!isConnected || !address) {
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
      setIsTransactionLoading(true);
      setTransactionStatus("pending");
      setTransactionTitle("Processing Transaction");
      setTransactionDescription(
        "Please wait while your transaction is being processed."
      );
      const bnbFeeAmount = parseEther(BNB_COMMISSION_FEE.toString());
      const destinationAddress = process.env
        .NEXT_PUBLIC_BSC_CA as `0x${string}`;
      let txHash = "";
      if (formData.paymentToken === "BNB") {
        // Convert BNB amount to wei
        const amount =
          parseEther(formData.totalAmount.toString()) + bnbFeeAmount;

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
      } else {
        const metadata = await getTokenMetadata(
          formData.customTokenAddress as `0x${string}`
        );
        if (!metadata) {
          throw new Error("Token metadata not found");
        }
        const chainAmount = math
          .bignumber(formData.totalAmount)
          .times(math.bignumber(10).pow(metadata.decimals))
          .toString();

        // Check token allowance
        const allowance = await publicClient.readContract({
          address: formData.customTokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "allowance",
          args: [address, destinationAddress],
        });

        if (allowance < BigInt(chainAmount)) {
          const approveHash = await writeContractAsync({
            abi: erc20Abi,
            address: formData.customTokenAddress as `0x${string}`,
            functionName: "approve",
            args: [destinationAddress, BigInt(chainAmount)],
          });
          const approveReceipt = await publicClient.waitForTransactionReceipt({
            hash: approveHash,
          });
          if (approveReceipt.status !== "success") {
            throw new Error("Token allowance approval failed");
          }
        }

        // Create bep20 transfer
        const hash = await writeContractAsync({
          abi: contractAbi,
          address: destinationAddress,
          functionName: "deposit",
          args: [
            formData.customTokenAddress as `0x${string}`,
            BigInt(chainAmount),
          ],
          value: bnbFeeAmount,
        });

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
        setTransactionHash(txHash);
        setTransactionStatus("success");
        setTransactionTitle("Transaction Successful");
        setTransactionDescription(
          "Your transaction has been processed successfully."
        );
        await createBuzzCampaign(txHash);
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      // alert(
      //   error instanceof Error ? error.message : "Payment processing failed"
      // );

      setTransactionStatus("error");
      setTransactionTitle("Transaction Failed");
      setTransactionDescription(
        error instanceof Error ? error.message : "Payment processing failed"
      );
    }
  };

  const createBuzzCampaign = async (txHash: string) => {
    if (!userInfo?.uid) {
      return;
    }
    console.log("formData.totalAmount", formData.totalAmount);
    if (Number(formData.totalAmount) <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }

    const deadline = new Date();
    // deadline.setHours(deadline.getHours() + Number(formData.deadline));
    deadline.setMinutes(deadline.getMinutes() + 5);

    try {
      setIsCreatingBuzz(true);
      const payload: CreateBuzzRequest = {
        tweetLink: formData.tweetLink,
        instructions: formData.instructions,
        tokenAmount: formData.totalAmount,
        deadline: deadline.toISOString(),
        paymentToken: formData.paymentToken,
        customTokenAddress: formData.customTokenAddress,
        transactionHash: txHash,
        rewardSettleType: formData.rewardSettleType,
        maxParticipants: formData.maxParticipants,
        participantMinimumTokenAmount: formData.minimumTokenAmount,
        shareOfKols: Number(shareOfKols),
        shareOfHolders: Number(shareOfHolders),
        shareOfOthers: Number(shareOfOthers),
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
    } finally {
      setIsCreatingBuzz(false);
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

              {/* Reward Settle Type Switch */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reward Distribution 💎
                </label>

                <div className="flex flex-col space-y-4">
                  <div className="hidden overflow-hidden">
                    <button
                      type="button"
                      className={`rounded-xl flex-1 py-3 px-4 text-center text-sm font-medium ${
                        formData.rewardSettleType === "default"
                          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => handleRewardSettleTypeChange("default")}
                    >
                      Split Among All
                    </button>

                    <button
                      type="button"
                      className={`invisible flex-1 py-3 px-4 text-center text-sm font-medium ${
                        formData.rewardSettleType === "fixed"
                          ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => handleRewardSettleTypeChange("fixed")}
                    >
                      Fixed Per Participant
                    </button>
                  </div>

                  {formData.rewardSettleType === "fixed" && (
                    <div>
                      <div className="space-y-2">
                        <label
                          htmlFor="maxParticipants"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Maximum Number of Participants
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                          <input
                            type="number"
                            name="maxParticipants"
                            id="maxParticipants"
                            className="block w-full pl-4 pr-20 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                            placeholder="Expected Participants"
                            min="1"
                            value={formData.maxParticipants}
                            onChange={handleInputChange}
                            required={formData.rewardSettleType === "fixed"}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-r-xl">
                            <span className="text-sm font-medium">users</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 italic">
                          Each participant will receive{" "}
                          {formData.maxParticipants > 0
                            ? (
                                formData.totalAmount / formData.maxParticipants
                              ).toFixed(6)
                            : 0}{" "}
                          {formData.paymentToken === "BNB" ? "BNB" : "Tokens"}
                        </p>
                      </div>

                      {/* Minimum Token Amount Field */}
                      <div className="space-y-2">
                        <label
                          htmlFor="minimumTokenAmount"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Minimum Token Requirement (Optional) 🔒
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                          <input
                            type="number"
                            name="minimumTokenAmount"
                            id="minimumTokenAmount"
                            className="block w-full pl-4 pr-20 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                            placeholder="0"
                            min="0"
                            step="any"
                            value={formData.minimumTokenAmount}
                            onChange={handleInputChange}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-r-xl">
                            <span className="text-sm font-medium">
                              {formData.paymentToken === "BNB"
                                ? "BNB"
                                : "Tokens"}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 italic">
                          Users must have at least this amount of{" "}
                          {formData.paymentToken === "BNB" ? "BNB" : "tokens"}{" "}
                          to receive reward
                        </p>
                      </div>
                    </div>
                  )}

                  {/* <Slider
                    getAriaLabel={() => "Temperature range"}
                    value={sharesValue}
                    onChange={handleChange}
                    valueLabelDisplay="auto"
                    sx={{
                      color: "transparent",
                      "& .MuiSlider-track": {
                        background:
                          "linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)",
                        border: "none",
                      },
                      "& .MuiSlider-thumb": {
                        background:
                          "linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)",
                        "&:hover, &.Mui-focusVisible": {
                          boxShadow: "0 0 0 8px rgba(99, 102, 241, 0.16)",
                        },
                      },
                      "& .MuiSlider-rail": {
                        background:
                          "linear-gradient(to right, #6366f1, #8b5cf6, #ec4899)",
                        opacity: 1,
                      },
                    }}
                  /> */}

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start">
                      {formData.rewardSettleType === "default" && (
                        <div className="space-y-4 w-full">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                KOLs Share (%)
                              </label>
                              <input
                                type="number"
                                className="block w-full pl-4 pr-4 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={shareOfKols}
                                onChange={(e) => {
                                  if (e.target.value === "") {
                                    setShareOfKols("");
                                    return;
                                  }
                                  const value = Math.min(
                                    100,
                                    Math.max(0, Number(e.target.value))
                                  );
                                  setShareOfKols(value.toString());
                                }}
                                min="0"
                                max="100"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Holders Share (%)
                              </label>
                              <input
                                type="number"
                                className="block w-full pl-4 pr-4 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={shareOfHolders}
                                onChange={(e) => {
                                  if (e.target.value === "") {
                                    setShareOfHolders("");
                                    return;
                                  }
                                  const value = Math.min(
                                    100,
                                    Math.max(0, Number(e.target.value))
                                  );
                                  setShareOfHolders(value.toString());
                                }}
                                min="0"
                                max="100"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Others Share (%)
                              </label>
                              <input
                                type="number"
                                className="block w-full pl-4 pr-4 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={shareOfOthers}
                                onChange={(e) => {
                                  if (e.target.value === "") {
                                    setShareOfOthers("");
                                    return;
                                  }
                                  const value = Math.min(
                                    100,
                                    Math.max(0, Number(e.target.value))
                                  );
                                  setShareOfOthers(value.toString());
                                }}
                                min="0"
                                max="100"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-700">
                              Total:{" "}
                              {Number(shareOfKols) +
                                Number(shareOfHolders) +
                                Number(shareOfOthers)}
                              %
                            </div>
                            {Number(shareOfKols) +
                              Number(shareOfHolders) +
                              Number(shareOfOthers) !==
                              100 && (
                              <div className="text-sm text-red-500">
                                Total must equal 100%
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-700">
                            Reward will be split into 3 parts: <br />
                            1. {Number(shareOfKols)}% for the KOLs, reward will
                            be distributed according to their KOL influence
                            score.
                            <br />
                            2. {Number(shareOfHolders)}% for the holders, reward
                            will be distributed according to their token
                            holdings;
                            <br />
                            3. {Number(shareOfOthers)}% for users not holding
                            tokens, reward will be distributed evenly among them;
                            <br />
                            <br />
                            If there is no participant in the above parts, the
                            reward will be returned to the creator.
                          </div>
                        </div>
                      )}

                      {formData.rewardSettleType === "fixed" && (
                        <span className="text-sm text-gray-700">
                          Each participant will receive a fixed amount,
                          remaining reward will be returned to the creator.
                        </span>
                      )}
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
                  disabled={isCreatingBuzz || isTransactionLoading}
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  {isCreatingBuzz
                    ? "Creating Buzz... 🚀"
                    : formData.paymentMethod === "in-app"
                    ? "Pay & Create Buzz Campaign 🚀"
                    : "Create Buzz Campaign 🚀"}
                </button>
              </div>

              <div className="flex justify-center">
                <TermsModal
                  trigger={
                    <div className="text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer">
                      User Terms
                    </div>
                  }
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      <TransactionLoadingModal
        isOpen={isTransactionLoading}
        onClose={() => setIsTransactionLoading(false)}
        status={transactionStatus}
        title={transactionTitle}
        description={transactionDescription}
        transactionHash={transactionHash}
      />
    </div>
  );
}
