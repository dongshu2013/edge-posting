"use client";

import {
  ChatBubbleLeftRightIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useState } from "react";
import ReplyLinkModal from "./ReplyLinkModal";
import { getReplyIntentUrl } from "@/lib/twitter";
import { useAuth } from "@/hooks/useAuth";
import { AuthButton } from "@/components/AuthButton";
import { fetchApi } from "@/lib/api";
import { ReplyModal } from "./ReplyModal";

export interface BuzzCardProps {
  id: string;
  tweetLink: string;
  instructions: string;
  price: number;
  replyCount: number;
  totalReplies: number;
  createdBy: string;
  deadline: string;
  createdAt?: Date;
  showViewReplies?: boolean;
  isActive?: boolean;
  hasReplied?: boolean;
  username: string;
}

// Utility function to convert tweet URL to embed URL
const getEmbedUrl = (tweetUrl: string) => {
  try {
    const url = new URL(tweetUrl);
    const pathParts = url.pathname.split("/");
    const tweetId = pathParts[pathParts.length - 1];
    return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`;
  } catch {
    return tweetUrl;
  }
};

const replyTemplates = [
  "[Test] Great point! 🎯 ",
  "[Test] Interesting perspective! 💡",
  "[Test] Love this! ✨",
  "[Test] Absolutely agree! 💯",
  "[Test] This is fascinating! 🌟",
];

export default function BuzzCard({
  id,
  tweetLink,
  instructions,
  price,
  replyCount,
  totalReplies,
  createdBy,
  deadline,
  createdAt,
  showViewReplies = true,
  isActive = true,
  hasReplied = false,
  username,
}: BuzzCardProps) {
  const { user } = useAuth();
  const [generateReplyModalOpen, setGenerateReplyModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedReplyText, setGeneratedReplyText] = useState("");

  // Parse dates and ensure proper comparison
  const deadlineTime = new Date(deadline).getTime();
  const currentTime = Date.now();
  const isExpired = !isActive || currentTime >= deadlineTime;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(createdBy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const handleReplySubmit = async ({
    replyLink,
    replyText,
  }: {
    replyLink: string;
    replyText: string;
  }) => {
    try {
      const response = await fetchApi("/api/reply", {
        method: "POST",
        body: JSON.stringify({
          buzzId: id,
          replyLink,
          text: replyText,
        }),
      });

      if (response.error) {
        throw new Error(response.error || "Failed to submit reply");
      }

      // Optionally refresh the page or update the UI
      window.location.reload();
    } catch (err) {
      throw err;
    }
  };

  const getRandomReplyText = () => {
    const template =
      replyTemplates[Math.floor(Math.random() * replyTemplates.length)];
    return template;
  };

  const handleReplyClick = () => {
    const replyText = getRandomReplyText();

    setGeneratedReplyText(replyText); // 保存生成的文案
    setGenerateReplyModalOpen(true);
  };

  const onGenerateReplySubmit = (replyText: string) => {
    setGeneratedReplyText(replyText);
    // Open Twitter in a popup window instead of a new tab
    // Configure popup window dimensions
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(
      getReplyIntentUrl(tweetLink, replyText),
      "twitter_popup",
      `width=${width},height=${height},left=${left},top=${top},popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    setIsReplyModalOpen(true);
    setGenerateReplyModalOpen(false);
  };

  const renderReplyButton = () => {
    if (!isActive || isExpired) {
      if (!user) {
        return <AuthButton buttonText="Reply (No Reward)" />;
      }
      return (
        <button
          onClick={handleReplyClick}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          Reply (No Reward)
        </button>
      );
    }

    if (replyCount >= totalReplies) {
      return <span className="text-gray-500">Full</span>;
    }

    if (!user) {
      return <AuthButton buttonText={`Reply & Earn ${price} BUZZ`} />;
    }

    return (
      <>
        {!hasReplied && (
          <button
            onClick={handleReplyClick}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
          >
            Reply & Earn {price} BUZZ
          </button>
        )}
      </>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div
        className={`rounded-2xl transition-all duration-300 p-4 sm:p-6 relative ${
          isExpired
            ? "bg-gray-50 border border-gray-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]"
            : "bg-white border border-gray-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)]"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:gap-6">
          <div
            className={`w-full lg:w-[350px] border rounded-xl overflow-hidden shrink-0 mb-4 lg:mb-0 ${
              isExpired ? "border-gray-200 opacity-75" : "border-gray-200"
            }`}
          >
            <div className="aspect-[3/4]">
              <iframe
                src={getEmbedUrl(tweetLink)}
                className="w-full h-full"
                frameBorder="0"
                title="Tweet Preview"
              />
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div
              className={`rounded-xl p-4 ${
                isExpired ? "bg-gray-100" : "bg-gray-50"
              }`}
            >
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-500">Created by</div>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {username || createdBy}
                    </div>
                    <button
                      onClick={handleCopyAddress}
                      className="inline-flex items-center justify-center p-1 rounded-md hover:bg-gray-200 transition-colors"
                      title={`Copy ID: ${createdBy}`}
                    >
                      {copied ? (
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <DocumentDuplicateIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-gray-500">Total Deposit</span>
                  <span className="font-medium">
                    {(price * totalReplies).toFixed(2)} BUZZ
                  </span>
                </div>
                {createdAt && (
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-gray-500">Created on</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-500">Expires on</div>
                  <div
                    className={`text-sm font-medium ${
                      isExpired ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {new Date(deadline).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`rounded-xl p-4 transform transition-all duration-200 hover:scale-[1.01] ${
                isExpired
                  ? "bg-gray-100"
                  : "bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50"
              }`}
            >
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <ChatBubbleLeftRightIcon
                  className={`h-5 w-5 mr-2 ${
                    isExpired ? "text-gray-400" : "text-blue-500"
                  }`}
                />
                Instructions
              </h4>
              <p
                className={`text-sm break-words ${
                  isExpired ? "text-gray-500" : "text-gray-600"
                }`}
              >
                {instructions}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              {showViewReplies && (
                <Link
                  href={`/buzz/${encodeURIComponent(id)}`}
                  className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-white text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                    isExpired
                      ? "bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                  View {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
                </Link>
              )}
              <div className="flex-shrink-0">{renderReplyButton()}</div>
            </div>
          </div>
        </div>
      </div>

      <ReplyLinkModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        onSubmit={handleReplySubmit}
        buzzAmount={price}
        initialReplyText={generatedReplyText} // 传入生成的文案
      />

      <ReplyModal
        instructions={instructions}
        isOpen={generateReplyModalOpen}
        initialContent={generatedReplyText}
        onClose={() => setGenerateReplyModalOpen(false)}
        onSubmit={onGenerateReplySubmit}
      />
    </div>
  );
}
