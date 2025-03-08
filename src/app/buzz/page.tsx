"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import BuzzCard from "@/components/BuzzCard";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { fetchApi } from "@/lib/api";

interface Buzz {
  id: string;
  tweetLink: string;
  instructions: string;
  context: string;
  credit: number;
  createdAt: Date;
  createdBy: string;
  deadline: string;
  replyCount: number;
  totalReplies: number;
  isActive: boolean;
}

interface BuzzResponse {
  items: Buzz[];
  nextCursor?: string;
  hasMore: boolean;
}

export default function BuzzesPage() {
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "price" | "engagement">(
    "newest"
  );
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchBuzzes = useCallback(
    async (cursor?: string): Promise<BuzzResponse> => {
      try {
        const url = new URL("/api/buzz", window.location.origin);
        if (cursor) {
          url.searchParams.append("cursor", cursor);
        }

        return await fetchApi(url.toString());
      } catch (err) {
        throw err;
      }
    },
    []
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchBuzzes(nextCursor);
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
    .filter((buzz) => (onlyActive ? buzz.isActive : true))
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return b.credit - a.credit;
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

        <div className="space-y-6">
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
                context={buzz.context}
                credit={buzz.credit}
                replyCount={buzz.replyCount}
                totalReplies={buzz.totalReplies}
                createdBy={buzz.createdBy}
                deadline={buzz.deadline}
                createdAt={new Date(buzz.createdAt)}
                isActive={buzz.isActive}
              />
            </div>
          ))}

          {isLoadingMore && (
            <div className="animate-pulse space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-64" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
