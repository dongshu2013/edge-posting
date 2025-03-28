"use client";

import {
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { AuthButton } from "@/components/AuthButton";
import ReplyLinkModal from "./ReplyLinkModal";
import { getReplyIntentUrl } from "@/lib/twitter";

export interface BuzzCardProps {
  id: string;
  tweetLink: string;
  tweetText?: string;
  instructions: string;
  tokenAmount: string;
  paymentToken: string;
  customTokenAddress: string;
  replyCount: number;
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
  "[Test] Great point! ",
  "[Test] Interesting perspective! ",
  "[Test] Love this! ",
  "[Test] Absolutely agree! ",
  "[Test] This is fascinating! ",
];

export default function BuzzCard({
  id,
  tweetLink,
  tweetText,
  instructions,
  replyCount,
  createdBy,
  deadline,
  createdAt,
  showViewReplies = true,
  isActive = true,
  hasReplied = false,
  username,
  tokenAmount,
  paymentToken,
  customTokenAddress,
}: BuzzCardProps) {
  const { user } = useAuth();
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [generatedReplyText, setGeneratedReplyText] = useState("");
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  // Parse dates and ensure proper comparison
  const deadlineTime = new Date(deadline).getTime();
  const currentTime = Date.now();
  const isExpired = !isActive || currentTime >= deadlineTime;

  // Format creation time as relative time (e.g., "1h ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // If it's today, show relative time
    if (diffInSeconds < 86400) {
      if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    }

    // Otherwise show the date
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // const handleCopyAddress = async () => {
  //   try {
  //     await navigator.clipboard.writeText(createdBy);
  //     setCopied(true);
  //     setTimeout(() => setCopied(false), 2000);
  //   } catch (err) {
  //     console.error("Failed to copy address:", err);
  //   }
  // };

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

  const handleDirectReply = async () => {
    setReplyLoading(true);
    // Get reply text from OpenAI
    const generateReplyResponse = await fetchApi("/api/generate-reply", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        instructions: instructions,
        tweetText: tweetText,
      }),
    }).catch((err) => {
      console.error("Error generating reply:", err);
    });
    const aiReplyText = generateReplyResponse?.text;

    console.log("aiReplyText", aiReplyText);

    const replyText = aiReplyText || getRandomReplyText();

    // Configure popup window dimensions
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    // Open Twitter directly in a popup window
    window.open(
      getReplyIntentUrl(tweetLink, replyText),
      "twitter_popup",
      `width=${width},height=${height},left=${left},top=${top},popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    // Open the reply link modal to track the reply
    setGeneratedReplyText(replyText);
    setIsReplyModalOpen(true);
    setReplyLoading(false);
  };

  const renderReplyButton = () => {
    // For expired or inactive buzzes - "Reply (No Reward)" with normal style
    if (!isActive || isExpired) {
      if (!user) {
        return (
          <AuthButton buttonText="Reply (No Reward)" variant="secondary" />
        );
      }
      return (
        <button
          onClick={handleDirectReply}
          disabled={replyLoading}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
        >
          {replyLoading ? "Generating..." : "Reply (No Reward)"}
        </button>
      );
    }

    // For active buzzes - "Reply & Earn X BUZZ" with colorful gradient
    if (!user) {
      return <AuthButton buttonText={`Reply & Earn`} variant="primary" />;
    }

    return (
      <>
        {!hasReplied && (
          <button
            id={`replyBuzz-${id}`}
            onClick={handleDirectReply}
            disabled={replyLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-200"
          >
            {replyLoading ? "Generating..." : "Reply & Earn"}
          </button>
        )}
      </>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-4">
        {/* Header with creator info and price */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-900">
              @{username || createdBy.substring(0, 6)}
            </span>
            <span className="mx-1 text-gray-500">·</span>
            {createdAt && (
              <span className="text-sm text-gray-500">
                {formatRelativeTime(new Date(createdAt))}
              </span>
            )}
          </div>
          <div className="text-sm font-medium">
            <span className="text-amber-500 font-semibold">
              {tokenAmount} BNB
            </span>
          </div>
        </div>

        {/* Twitter Embed */}
        <div className="border rounded-lg overflow-hidden mb-3">
          <div className="h-72">
            <iframe
              src={getEmbedUrl(tweetLink)}
              className="w-full h-full"
              frameBorder="0"
              title="Tweet Preview"
            />
          </div>
        </div>

        {/* Instructions */}
        <div
          className="mb-3 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setShowInstructionsModal(true)}
          title={instructions}
        >
          <div className="flex items-start text-sm text-gray-700">
            <LightBulbIcon className="h-4 w-4 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="h-10 overflow-hidden">
              <p className="line-clamp-2">{instructions}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          {showViewReplies && (
            <button
              onClick={() =>
                (window.location.href = `/buzz/${encodeURIComponent(id)}`)
              }
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
              View {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
            </button>
          )}
          <div>{renderReplyButton()}</div>
        </div>
      </div>

      <ReplyLinkModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        onSubmit={handleReplySubmit}
        tokenAmount={tokenAmount}
        initialReplyText={generatedReplyText}
      />

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <LightBulbIcon className="h-5 w-5 mr-2 text-amber-500" />
                  Instructions
                </h3>
                <button
                  onClick={() => setShowInstructionsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {instructions}
              </p>
            </div>
            <div className="px-5 py-3 bg-gray-50 flex justify-end rounded-b-xl">
              <button
                onClick={() => setShowInstructionsModal(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
