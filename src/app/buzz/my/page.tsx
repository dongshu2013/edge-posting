"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { SparklesIcon, PlusIcon } from "@heroicons/react/24/outline";
import BuzzCard from "@/components/BuzzCard";
import { useRouter } from "next/navigation";
import { PaymentModal } from "@/components/PaymentModal";
import { paymentServiceApplicationId } from "@/config";
import { useQuery } from "@tanstack/react-query";
import { paymentServiceUrl } from "@/config";

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
}

export default function MyBuzzesPage() {
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "engagement">("newest");
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const fetchBuzzes = useCallback(
    async (cursor?: string): Promise<BuzzResponse | null> => {
      if (!address) return null;

      try {
        const url = new URL("/api/buzz", window.location.origin);
        url.searchParams.append("createdBy", address);
        if (cursor) {
          url.searchParams.append("cursor", cursor);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
          throw new Error("Failed to fetch buzzes");
        }
        const data = await response.json();
        console.log("Fetched buzzes:", data);
        return data;
      } catch (err) {
        console.error("Error in fetchBuzzes:", err);
        throw err;
      }
    },
    [address]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !isConnected) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchBuzzes(nextCursor);
      if (data) {
        setBuzzes((prev) => [...prev, ...data.items]);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch more buzzes"
      );
      console.error("Error fetching more buzzes:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, isConnected, nextCursor, fetchBuzzes]);

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
    if (!isConnected) {
      router.push("/");
      return;
    }

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
        setError(err instanceof Error ? err.message : "Failed to fetch buzzes");
        console.error("Error fetching buzzes:", err);
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
    .filter((buzz) => (onlyActive ? buzz.isActive : true))
    .sort((a, b) => {
      switch (sortBy) {
        case "engagement":
          return b.replyCount - a.replyCount;
        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    const userOrdersQuery = useQuery({
      queryKey: ["payment-user-orders", address],
      queryFn: async () => {
        const resJson = await fetch(
          `${paymentServiceUrl}/user-orders?payerId=${address}&applicationId=${paymentServiceApplicationId}`
        ).then((res) => res.json());
  
        return resJson?.data?.orders || [];
      },
    });


  if (!isConnected) {
    return null;
  }

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

  return (
    <div className="py-8">
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "newest" | "engagement")
            }
            className="text-base sm:text-lg border-gray-300 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-indigo-300 py-2 px-4"
          >
            <option value="newest">✨ Newest First</option>
            <option value="engagement">🔥 Highest Engagement</option>
          </select>

          <div
            className="flex items-center justify-between gap-3 bg-white rounded-2xl px-6 py-3 shadow-sm border border-gray-200 w-full sm:w-auto cursor-pointer"
            onClick={() => setPaymentModalOpen(true)}
          >
            Deposit
          </div>

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
          {sortedBuzzes.length > 0 ? (
            <>
              {sortedBuzzes.map((buzz) => (
                <BuzzCard
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

      <div className="mt-5 bg-white rounded-2xl shadow-xl p-12 text-center">
        My orders
        {userOrdersQuery.data?.map((order: any) => (
          <div key={order.id} className="flex items-center">
            <div className="flex-1">id: {order.id}</div>
            <div className="flex-1">
              amount: {Number(order.transfer_amount_on_chain) / Math.pow(10, 6)}
            </div>
            <div className="flex-1">status: {order.status}</div>
          </div>
        ))}
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={async (amount: number) => {}}
        buzzAmount={2}
      />
    </div>
  );
}
