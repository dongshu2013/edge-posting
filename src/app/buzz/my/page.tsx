"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import BuzzCard from "@/components/BuzzCard";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { fetchApi } from "@/lib/api";

interface Buzz {
  id: string;
  tweetLink: string;
  instructions: string;
  price: number;
  replyCount: number;
  totalReplies: number;
  createdBy: string;
  deadline: string;
  createdAt: Date;
  isActive: boolean;
  user: {
    username: string;
  };
}

export default function MyBuzzesPage() {
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"newest" | "price" | "engagement">(
    "newest"
  );
  const [onlyActive, setOnlyActive] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();

  const fetchUserBuzzes = useCallback(
    async (cursor?: string) => {
      if (!user) return null;

      try {
        const url = new URL(`/api/buzz`, window.location.origin);
        url.searchParams.append("createdBy", user.uid);
        if (cursor) {
          url.searchParams.append("cursor", cursor);
        }

        return await fetchApi(url.toString());
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

        const data = await fetchUserBuzzes();
        if (data) {
          setBuzzes(data.items);
          setNextCursor(data.nextCursor);
          setHasMore(data.hasMore);
        }
      } catch (err) {
        console.error("Error fetching buzzes:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch buzzes");
      } finally {
        setIsLoading(false);
      }
    };

    initialFetch();
  }, [user, loading, router, fetchUserBuzzes]);

  const loadMore = async () => {
    if (!nextCursor || !hasMore || !user) return;

    try {
      const data = await fetchUserBuzzes(nextCursor);
      if (data) {
        setBuzzes((prev) => [...prev, ...data.items]);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error("Error fetching more buzzes:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch more buzzes"
      );
    }
  };

  // Sort and filter buzzes
  const sortedBuzzes = [...buzzes]
    .filter((buzz) => {
      if (!onlyActive) return true;
      const deadlineTime = new Date(buzz.deadline).getTime();
      const currentTime = Date.now();
      return buzz.isActive && currentTime < deadlineTime;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return b.price - a.price;
        case "engagement":
          return b.replyCount - a.replyCount;
        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
          ))}
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

  return (
    <div className="py-8">
      <div className="flex-1">
        {buzzes.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "newest" | "price" | "engagement")
              }
              className="text-base sm:text-lg border-gray-300 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 py-2 px-4"
            >
              <option value="newest">✨ Newest First</option>
              <option value="price">💰 Highest Price</option>
              <option value="engagement">🔥 Highest Engagement</option>
            </select>

            <div className="flex items-center justify-between gap-3 bg-white rounded-2xl px-6 py-3 shadow-sm border border-gray-200 w-full sm:w-auto">
              <span className="text-base sm:text-lg text-gray-700 font-medium">
                Only active buzzes
              </span>
              <button
                role="switch"
                id="onlyActive"
                aria-checked={onlyActive}
                onClick={() => setOnlyActive(!onlyActive)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  onlyActive ? "bg-indigo-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                    onlyActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {sortedBuzzes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedBuzzes.map((buzz) => (
                  <BuzzCard
                    key={buzz.id}
                    id={buzz.id}
                    tweetLink={buzz.tweetLink}
                    instructions={buzz.instructions}
                    price={buzz.price}
                    replyCount={buzz.replyCount}
                    totalReplies={buzz.totalReplies}
                    createdBy={buzz.createdBy}
                    deadline={buzz.deadline}
                    createdAt={buzz.createdAt}
                    isActive={buzz.isActive}
                    username={buzz?.user?.username}
                  />
                ))}
              </div>
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
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
              <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No buzzes yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first buzz to start engaging with the community! ✨
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
