"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import BuzzCard from "@/components/BuzzCard";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { fetchApi } from "@/lib/api";
import Link from "next/link";
import ActiveBuzzesToggle from "@/components/ActiveBuzzesToggle";

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
  const searchParams = useSearchParams();
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const { user, loading } = useAuth();
  const router = useRouter();

  const showAll = searchParams.get("showAll") === "true";
  const sortBy = useMemo(() => {
    const sortByParam = searchParams.get("sortBy");
    switch (sortByParam) {
      case "newest":
        return "newest";
      case "price":
        return "price";
      case "engagement":
        return "engagement";
      default:
        return "newest";
    }
  }, [searchParams]);

  const fetchUserBuzzes = useCallback(
    async (cursor?: string) => {
      if (!user) return null;

      try {
        const url = new URL(`/api/buzz`, window.location.origin);
        url.searchParams.append("createdBy", user.uid);
        if (cursor) {
          url.searchParams.append("cursor", cursor);
        }
        if (sortBy) {
          url.searchParams.append("sortBy", sortBy);
        }
        if (!showAll) {
          url.searchParams.append("onlyActive", "true");
        }

        return await fetchApi(url.toString());
      } catch (err) {
        throw err;
      }
    },
    [user, sortBy, showAll]
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
      if (showAll) return true;
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set("sortBy", e.target.value);
              router.push(url.toString());
            }}
            className="w-[260px] text-base sm:text-lg border-gray-300 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 py-2 pl-4 pr-8"
          >
            <option value="newest">✨ Newest First</option>
            <option value="price">💰 Highest Price</option>
            <option value="engagement">🔥 Most Engagement</option>
          </select>

          <ActiveBuzzesToggle
            isActive={!showAll}
            onToggle={() => {
              const url = new URL(window.location.href);
              url.searchParams.set("showAll", (!showAll).toString());
              router.push(url.toString());
            }}
          />
        </div>

        <div className="space-y-6">
          {sortedBuzzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedBuzzes.map((buzz) => (
                <div
                  key={buzz.id}
                  className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300 overflow-hidden"
                >
                  <BuzzCard
                    id={buzz.id}
                    tweetLink={buzz.tweetLink}
                    instructions={buzz.instructions}
                    price={buzz.price}
                    replyCount={buzz.replyCount}
                    totalReplies={buzz.totalReplies}
                    createdBy={buzz.createdBy}
                    deadline={buzz.deadline}
                    createdAt={buzz.createdAt}
                    showViewReplies={true}
                    isActive={buzz.isActive}
                    username={buzz.user.username}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-9 text-center">
              <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No buzzes yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first buzz to start earning rewards! 🚀
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
        </div>
      </div>
    </div>
  );
}
