"use client";

import { useState, useEffect } from "react";
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
}

export default function MyBuzzesPage() {
  const [buzzes, setBuzzes] = useState<Buzz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const { user, loading } = useAuth();
  const router = useRouter();

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

        const data = await fetchApi(`/api/buzz?createdBy=${user.uid}`);
        setBuzzes(data.items);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (err) {
        console.error("Error fetching buzzes:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch buzzes");
      } finally {
        setIsLoading(false);
      }
    };

    initialFetch();
  }, [user, loading, router]);

  const loadMore = async () => {
    if (!nextCursor || !hasMore || !user) return;

    try {
      const data = await fetchApi(
        `/api/buzz?createdBy=${user.uid}&cursor=${nextCursor}`
      );
      setBuzzes((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error("Error fetching more buzzes:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch more buzzes"
      );
    }
  };

  if (!user) {
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
        <div className="space-y-6">
          {buzzes.length > 0 ? (
            <>
              {buzzes.map((buzz) => (
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
                />
              ))}
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
