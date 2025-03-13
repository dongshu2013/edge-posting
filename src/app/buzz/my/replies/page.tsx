"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SparklesIcon, ChatBubbleLeftRightIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { fetchApi } from "@/lib/api";
import Link from "next/link";

interface Reply {
  id: string;
  text: string;
  replyLink: string;
  createdAt: Date;
  createdBy: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  buzzId: string;
  buzz: {
    id: string;
    createdBy: string;
    user: {
      username: string;
    }
  };
  user: {
    username: string;
  };
}

interface PaginatedResponse {
  items: Reply[];
  nextCursor: string | undefined;
  hasMore: boolean;
}

export default function MyRepliesPage() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"newest" | "status">("newest");
  const [selectedReply, setSelectedReply] = useState<Reply | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();

  const fetchUserReplies = useCallback(
    async (cursor?: string): Promise<PaginatedResponse | null> => {
      if (!user) return null;

      try {
        const url = new URL(`/api/reply/my`, window.location.origin);
        if (cursor) {
          url.searchParams.append("cursor", cursor);
        }

        const data = await fetchApi(url.toString());
        return data;
      } catch (err) {
        throw err;
      }
    },
    [user]
  );

  useEffect(() => {
    if (loading) return;

    const initialFetch = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user) {
          router.push("/buzz");
          return;
        }

        const data = await fetchUserReplies();
        if (data) {
          setReplies(data.items);
          setNextCursor(data.nextCursor);
          setHasMore(data.hasMore);
        }
      } catch (err) {
        console.error("Error fetching replies:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch replies");
      } finally {
        setIsLoading(false);
      }
    };

    initialFetch();
  }, [user, loading, router, fetchUserReplies]);

  const loadMore = async () => {
    if (!nextCursor || !hasMore || !user) return;

    try {
      const data = await fetchUserReplies(nextCursor);
      if (data) {
        setReplies((prev) => [...prev, ...data.items]);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error("Error fetching more replies:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch more replies"
      );
    }
  };

  // Sort replies
  const sortedReplies = [...replies].sort((a, b) => {
    switch (sortBy) {
      case "status":
        // Sort by status: APPROVED first, then PENDING, then REJECTED
        const statusOrder = { APPROVED: 0, PENDING: 1, REJECTED: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      case "newest":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (!user) {
    return null;
  }

  return (
    <div className="py-8">
      <div className="flex-1">
        <div className="flex flex-col space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-500" />
              <h1 className="text-2xl font-semibold">My Replies</h1>
            </div>

            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "newest" | "status")}
              className="text-base border-gray-300 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 py-2 px-4"
            >
              <option value="newest">✨ Newest First</option>
              <option value="status">📊 By Status</option>
            </select>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-[350px] rounded-2xl" />
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : sortedReplies.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedReplies.map((reply) => (
                  <div key={reply.id} className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300 overflow-hidden w-full">
                    <div className="p-4">
                      {/* Reply Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <span className="text-[13px] text-gray-900">
                            @{reply.buzz.user.username}
                          </span>
                          <span className="text-[13px] text-gray-500 ml-1">· Mar 12</span>
                        </div>
                        <div>
                          {reply.status === "PENDING" && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tweet Embed */}
                      <div className="rounded-2xl overflow-hidden mb-5">
                        <div className="aspect-[16/9]">
                          <iframe
                            src={getEmbedUrl(reply.replyLink)}
                            className="w-full h-full"
                            frameBorder="0"
                            title="Reply Preview"
                          />
                        </div>
                      </div>

                      {/* Reply Text */}
                      <div 
                        className="bg-gray-50 rounded-2xl p-4 cursor-pointer mb-5"
                        onClick={() => setSelectedReply(reply)}
                      >
                        <p className="text-[13px] text-gray-600 line-clamp-2">
                          {reply.text}
                        </p>
                      </div>

                      {/* View Original Buzz Button */}
                      <button
                        onClick={() => window.open(`/buzz/${reply.buzzId}`, '_blank')}
                        className="inline-flex items-center px-4 py-2 border border-gray-200 text-[13px] font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 w-full justify-center gap-1.5"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        View Original Buzz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No replies yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start replying to buzzes to earn rewards! 🚀
              </p>
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMore}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                Load More
              </button>
            </div>
          )}

          {/* Reply Text Modal */}
          {selectedReply && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Reply to @{selectedReply.buzz.user.username}
                    </h3>
                    <button 
                      onClick={() => setSelectedReply(null)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedReply.text}</p>
                </div>
                <div className="px-5 py-3 bg-gray-50 flex justify-end rounded-b-xl">
                  <button
                    onClick={() => setSelectedReply(null)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to get embed URL from tweet URL
function getEmbedUrl(tweetUrl: string) {
  const tweetId = tweetUrl.split("/").pop();
  return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`;
}
