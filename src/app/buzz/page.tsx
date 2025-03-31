"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import BuzzCard from "@/components/BuzzCard";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { fetchApi } from "@/lib/api";
import ActiveBuzzesToggle from "@/components/ActiveBuzzesToggle";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import FilterTokenBuzzesToggle from "@/components/FilterTokenBuzzesToggle";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/store/userStore";

interface Buzz {
  id: string;
  tweetLink: string;
  instructions: string;
  tokenAmount: string;
  paymentToken: string;
  customTokenAddress: string;
  rewardSettleType?: string;
  maxParticipants?: number;
  replyCount: number;
  createdBy: string;
  deadline: string;
  createdAt: Date;
  isActive: boolean;
  user: {
    username: string;
  };
  _count: {
    replies: number;
  };
}

interface BuzzResponse {
  items: Buzz[];
  nextCursor?: string;
  hasMore: boolean;
}

export default function BuzzesPage() {
  return (
    <Suspense fallback={<div className="py-8">Loading buzzes...</div>}>
      <BuzzesPageContent />
    </Suspense>
  );
}

function BuzzesPageContent() {
  const router = useRouter();
  const { userInfo } = useUserStore();
  const searchParams = useSearchParams();
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  console.log("🍷", userInfo);

  const showAll = searchParams.get("showAll") === "true";
  const filterToken = searchParams.get("filterToken") === "true";
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

  const fetchBuzzes = useCallback(
    async (cursor?: string): Promise<BuzzResponse> => {
      try {
        const url = new URL("/api/buzz", window.location.origin);
        if (cursor) {
          url.searchParams.append("cursor", cursor);
        }
        if (sortBy) {
          url.searchParams.append("sortBy", sortBy);
        }
        if (!showAll) {
          url.searchParams.append("onlyActive", "true");
        }
        if (filterToken) {
          url.searchParams.append("filterToken", "true");
        }
        // Only show buzzes that the user hasn't replied to
        url.searchParams.append("excludeReplied", "true");

        return await fetchApi(url.toString());
      } catch (err) {
        throw err;
      }
    },
    [showAll, sortBy, filterToken]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchBuzzes(nextCursor);
      console.log("🍷", data);
      setBuzzes((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch more buzzes"
      );
      console.error("Error fetching more buzzes:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, nextCursor, fetchBuzzes]);

  const lastBuzzElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoadingMore) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      if (node) {
        observer.current = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        });
        observer.current.observe(node);
      }
    },
    [isLoadingMore, hasMore, loadMore]
  );

  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true);
      try {
        const data = await fetchBuzzes();
        setBuzzes(data.items);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch buzzes");
        console.error("Error fetching buzzes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initialFetch();
  }, [fetchBuzzes]);

  // Clean up observer on component unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  const sortedBuzzes = [...buzzes]
    // .filter((buzz) => {
    //   if (showAll) return true;
    //   const deadlineTime = new Date(buzz.deadline).getTime();
    //   const currentTime = Date.now();
    //   return buzz.isActive && currentTime < deadlineTime;
    // })
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return Number(b.tokenAmount) - Number(a.tokenAmount);
        case "engagement":
          return b.replyCount - a.replyCount;
        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-64" />
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

  if (buzzes.length === 0) {
    return (
      <div className="py-8">
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

          <div className="flex gap-4 items-center">
            {!!userInfo?.uid && (
              <FilterTokenBuzzesToggle
                isActive={filterToken}
                onToggle={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set(
                    "filterToken",
                    (!filterToken).toString()
                  );
                  router.push(url.toString());
                }}
              />
            )}

            <ActiveBuzzesToggle
              isActive={!showAll}
              onToggle={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("showAll", (!showAll).toString());
                router.push(url.toString());
              }}
            />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No buzzes yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect your wallet and create your first buzz!
          </p>
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

          <div className="flex gap-4 items-center">
            {!!userInfo?.uid && (
              <FilterTokenBuzzesToggle
                isActive={filterToken}
                onToggle={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set(
                    "filterToken",
                    (!filterToken).toString()
                  );
                  router.push(url.toString());
                }}
              />
            )}

            <ActiveBuzzesToggle
              isActive={!showAll}
              onToggle={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("showAll", (!showAll).toString());
                router.push(url.toString());
              }}
            />
          </div>
        </div>

        {/* Grid layout for BuzzCards */}
        {sortedBuzzes.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedBuzzes.map((buzz, index) => (
                <div
                  key={buzz.id}
                  ref={
                    index === sortedBuzzes.length - 1
                      ? lastBuzzElementRef
                      : undefined
                  }
                >
                  <BuzzCard
                    id={buzz.id}
                    tweetLink={buzz.tweetLink}
                    instructions={buzz.instructions}
                    replyCount={buzz?._count?.replies || 0}
                    createdBy={buzz.createdBy}
                    deadline={buzz.deadline}
                    createdAt={buzz.createdAt}
                    isActive={buzz.isActive}
                    username={buzz?.user?.username}
                    tokenAmount={buzz.tokenAmount}
                    paymentToken={buzz.paymentToken}
                    customTokenAddress={buzz.customTokenAddress}
                    rewardSettleType={buzz.rewardSettleType}
                    maxParticipants={buzz.maxParticipants}
                  />
                </div>
              ))}
            </div>

            {isLoadingMore && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl h-64 animate-pulse"
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No buzzes found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later for new buzzes!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
