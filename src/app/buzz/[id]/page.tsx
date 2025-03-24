"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import BuzzCard from "@/components/BuzzCard";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { useUserStore } from "@/store/userStore";

interface Reply {
  id: string;
  text: string;
  replyLink: string;
  createdAt: Date;
  createdBy: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  user: {
    username: string;
  };
}

interface Buzz {
  id: string;
  tweetLink: string;
  tweetText?: string;
  instructions: string;
  tokenAmount: string;
  paymentToken: string;
  customTokenAddress: string;
  replyCount: number;
  totalReplies: number;
  createdBy: string;
  deadline: string;
  createdAt: Date;
  isActive: boolean;
  replies: Reply[];
  hasReplied?: boolean;
  user: {
    username: string;
  };
}

export default function BuzzDetailPage() {
  const params = useParams();
  const userInfo = useUserStore((state) => state.userInfo);
  const [buzz, setBuzz] = useState<Buzz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReplied, setHasReplied] = useState(false);
  const [selectedReply, setSelectedReply] = useState<Reply | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const isOwner =
    userInfo &&
    buzz?.createdBy &&
    userInfo.uid.toLowerCase() === buzz?.createdBy.toLowerCase();

  const fetchBuzzDetails = async () => {
    try {
      const data = await fetchApi(`/api/buzz/${params.id}`);

      if (!data) {
        throw new Error(data.error || "Failed to fetch buzz details");
      }

      console.log("🍓 User:", userInfo);
      const replied = data.replies.some(
        (reply: Reply) => reply.createdBy === userInfo?.uid
      );

      console.log("🍓Has replied:", replied);

      setHasReplied(replied);
      setBuzz(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch buzz details"
      );
      console.error("Error fetching buzz details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchBuzzDetails();
    }
  }, [params.id, userInfo]);

  const handleReplyClick = (reply: Reply) => {
    setSelectedReply(reply);
    setShowReplyModal(true);
  };

  const handleReject = async (replyId: string) => {
    if (!isOwner || !buzz?.id) return;

    try {
      setIsRejecting(true);
      setError(null);

      const response = await fetchApi(`/api/reply/${replyId}/reject`, {
        method: "POST",
      });

      if (response.error) {
        throw new Error(response.error || "Failed to reject reply");
      }

      fetchBuzzDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject reply");
      console.error("Error rejecting reply:", err);
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-32 bg-gray-200 rounded mb-6" />
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-[400px] h-64 bg-gray-200 rounded-2xl" />
          <div className="flex-1 space-y-6">
            <div className="h-40 bg-gray-200 rounded-2xl" />
            <div className="h-40 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!buzz) {
    return (
      <div className="py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-600">Buzz not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/buzz"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all duration-200"
        >
          ← Back to Buzzes
        </Link>
      </div>

      {/* Main Content - Left/Right Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side - Fixed Buzz Card */}
        <div className="lg:w-[400px] lg:sticky lg:top-4 lg:self-start">
          <BuzzCard
            id={buzz.id}
            tweetLink={buzz.tweetLink}
            tweetText={buzz.tweetText}
            instructions={buzz.instructions}
            tokenAmount={buzz.tokenAmount}
            paymentToken={buzz.paymentToken}
            customTokenAddress={buzz.customTokenAddress}
            replyCount={buzz.replyCount}
            createdBy={buzz.createdBy}
            deadline={buzz.deadline}
            createdAt={buzz.createdAt}
            isActive={buzz.isActive}
            showViewReplies={false}
            hasReplied={hasReplied}
            username={buzz?.user?.username}
          />
        </div>

        {/* Right Side - Scrollable Replies */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
            <h2 className="flex items-center gap-2 text-xl sm:text-2xl">
              <ChatBubbleLeftRightIcon className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500" />
              <span className="text-blue-500">Replies</span>
              <span className="text-gray-900">({buzz.replies.length})</span>
            </h2>
          </div>

          {buzz.replies.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No replies yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Be the first to reply and earn BUZZ! 🚀
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buzz.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300 p-4 overflow-hidden"
                >
                  {/* Reply Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        @{reply?.user?.username}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(reply.createdAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>

                      <div className="flex items-center gap-2">
                        {isOwner && reply.status === "PENDING" && (
                          <button
                            onClick={() => handleReject(reply.id)}
                            disabled={isRejecting}
                            className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-1 border border-red-300 text-sm font-medium rounded-lg text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isRejecting ? "Rejecting..." : "Reject"}
                          </button>
                        )}
                      </div>
                    </div>
                    <div>
                      {reply.status === "APPROVED" && (
                        <span className="hidden items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      )}
                      {reply.status === "REJECTED" && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Rejected
                        </span>
                      )}
                      {reply.status === "PENDING" && (
                        <span className="hidden items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tweet Embed */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
                    <div className="aspect-[16/9]">
                      <iframe
                        src={getEmbedUrl(reply.replyLink)}
                        className="w-full h-full"
                        frameBorder="0"
                        title="Reply Preview"
                      />
                    </div>
                  </div>

                  {/* Reply Text - Truncated */}
                  <div
                    className="bg-gray-50 rounded-xl p-3 cursor-pointer h-[60px] flex items-center"
                    onClick={() => handleReplyClick(reply)}
                  >
                    <p className="text-gray-600 text-sm line-clamp-2 w-full">
                      {reply.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reply Text Modal */}
      {showReplyModal && selectedReply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Reply from @{selectedReply?.user?.username}
                </h3>
                <button
                  onClick={() => setShowReplyModal(false)}
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
                {selectedReply.text}
              </p>
            </div>
            <div className="px-5 py-3 bg-gray-50 flex justify-end rounded-b-xl">
              <button
                onClick={() => setShowReplyModal(false)}
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

// Helper function to get embed URL from tweet URL
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
