"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BoltIcon } from "@heroicons/react/24/outline";
import { fetchApi } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { COMMISSION_RATE } from "@/config/common";

export default function NewBuzzPage() {
  const router = useRouter();
  const userInfo = useUserStore((state) => state.userInfo);
  const [formData, setFormData] = useState({
    tweetLink: "",
    instructions: "",
    pricePerReply: 1,
    numberOfReplies: 100,
    deadline: 1,
  });

  const rewardAmount = useMemo(() => {
    return (formData.pricePerReply * formData.numberOfReplies).toFixed(2);
  }, [formData.pricePerReply, formData.numberOfReplies]);

  // 20% commission
  const commissionAmount = useMemo(() => {
    return (Number(rewardAmount) * COMMISSION_RATE).toFixed(2);
  }, [rewardAmount]);

  const totalDeposit = useMemo(() => {
    return (Number(rewardAmount) + Number(commissionAmount)).toFixed(2);
  }, [rewardAmount, commissionAmount]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "pricePerReply" || name === "numberOfReplies"
          ? parseFloat(value)
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + Number(formData.deadline));

    try {
      const buzz = await fetchApi("/api/buzz/create", {
        method: "POST",
        body: JSON.stringify({
          tweetLink: formData.tweetLink,
          instructions: formData.instructions,
          price: formData.pricePerReply,
          createdBy: userInfo?.uid,
          deadline: deadline.toISOString(),
          numberOfReplies: formData.numberOfReplies,
        }),
      });

      if (!buzz) {
        throw new Error(buzz.error || "Failed to create buzz");
      }

      // Show success message
      alert("Buzz created successfully!");

      // Redirect to the buzz details page
      router.push(`/buzz/${buzz.id}`);
    } catch (error) {
      console.error("Error creating buzz:", error);
      alert(error instanceof Error ? error.message : "Failed to create buzz");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Create Your Buzz 🐝
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Let&apos;s make some noise in the meme-verse! 🚀
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl bg-white/90 border border-gray-100">
          <div className="px-6 py-6 sm:p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Tweet Link Input */}
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

              {/* Instructions Input */}
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

              {/* Settings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Price Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="pricePerReply"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Price 💰
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <input
                      type="number"
                      name="pricePerReply"
                      id="pricePerReply"
                      className="block w-full pl-4 pr-20 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      value={formData.pricePerReply}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-r-xl">
                      <span className="text-sm font-medium">BUZZ</span>
                    </div>
                  </div>
                </div>

                {/* Replies Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="numberOfReplies"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Replies 🎯
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <input
                      type="number"
                      name="numberOfReplies"
                      id="numberOfReplies"
                      className="block w-full pl-4 pr-20 py-2.5 text-base border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ease-in-out hover:border-indigo-300"
                      placeholder="100"
                      step="1"
                      min="1"
                      value={formData.numberOfReplies}
                      onChange={handleInputChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-r-xl">
                      <span className="text-sm font-medium">replies</span>
                    </div>
                  </div>
                </div>

                {/* Deadline Input */}
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

              {/* Total Deposit Summary */}
              <div className="mt-6 bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Total Deposit Required:
                  </span>
                  <span className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
                    {totalDeposit} BUZZ
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-400">
                    Reward Amount:
                  </span>
                  <span className="text-md font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
                    {rewardAmount} BUZZ
                  </span>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-400">
                    Commission Fee:
                  </span>
                  <span className="text-md font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-600">
                    {commissionAmount} BUZZ
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  Create Buzz Campaign 🚀
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
