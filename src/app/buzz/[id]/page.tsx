"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import BuzzCard from "@/components/BuzzCard";
import ReplyCard from "@/components/ReplyCard";
import { useParams } from "next/navigation";
import { fetchApi } from "@/lib/api";

interface Reply {
  id: string;
  text: string;
  replyLink: string;
  createdAt: Date;
  createdBy: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

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
  replies: Reply[];
}

export default function BuzzDetailPage() {
  const params = useParams();
  const [buzz, setBuzz] = useState<Buzz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuzzDetails = async () => {
      try {
        const data = await fetchApi(`/api/buzz/${params.id}`);

        if (!data) {
          throw new Error(data.error || "Failed to fetch buzz details");
        }

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

    if (params.id) {
      fetchBuzzDetails();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-32 bg-gray-200 rounded mb-6" />
        <div className="h-64 bg-gray-200 rounded-2xl mb-8" />
        <div className="space-y-6">
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
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

      {/* Original Tweet Card */}
      <div className="mb-8">
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
          isActive={buzz.isActive}
        />
      </div>

      {/* Replies Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
          <h2 className="flex items-center gap-2 text-xl sm:text-2xl">
            <ChatBubbleLeftRightIcon className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500" />
            <span className="text-blue-500">Replies</span>
            <span className="text-gray-900">({buzz.replies.length})</span>
          </h2>
        </div>

        <div className="space-y-6">
          {buzz.replies.map((reply) => (
            <ReplyCard
              key={reply.id}
              id={reply.id}
              text={reply.text}
              replyLink={reply.replyLink}
              createdAt={new Date(reply.createdAt)}
              createdBy={reply.createdBy}
              buzzCreator={buzz.createdBy}
              buzzId={buzz.id}
              status={reply.status}
            />
          ))}

          {buzz.replies.length === 0 && (
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No replies yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Be the first to reply and earn BUZZ! 🚀
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
