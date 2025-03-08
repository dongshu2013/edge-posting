import { useAccount } from "wagmi";
import { useState } from "react";
import {
  XMarkIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useUserInfo } from "@/hooks/useUserInfo";

interface ReplyCardProps {
  id: string;
  replyLink: string;
  text: string;
  createdAt: Date;
  createdBy: string;
  buzzCreator: string;
  buzzId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  showOriginalBuzzButton?: boolean;
  showRejectButton?: boolean;
}

// Get embed URL from tweet URL
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

export default function ReplyCard({
  id,
  replyLink,
  text,
  createdAt,
  createdBy,
  buzzCreator,
  buzzId,
  status = "PENDING",
  showOriginalBuzzButton = false,
  showRejectButton = true,
}: ReplyCardProps) {
  const { address } = useAccount();
  const { userInfo } = useUserInfo(createdBy);
  const isOwner =
    address &&
    buzzCreator &&
    address.toLowerCase() === buzzCreator.toLowerCase();
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(createdBy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const handleReject = async () => {
    if (!isOwner || currentStatus !== "PENDING") return;

    try {
      setIsRejecting(true);
      setError(null);

      const response = await fetch(`/api/reply/${id}/reject`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject reply");
      }

      setCurrentStatus("REJECTED");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject reply");
      console.error("Error rejecting reply:", err);
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckIcon className="mr-1 h-4 w-4" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XMarkIcon className="mr-1 h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300 p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:gap-6">
        {/* Tweet Embed */}
        <div className="w-full lg:w-[350px] border border-gray-200 rounded-xl overflow-hidden shrink-0 mb-4 lg:mb-0">
          <div className="aspect-[16/9]">
            <iframe
              src={getEmbedUrl(replyLink)}
              className="w-full h-full"
              frameBorder="0"
              title="Reply Preview"
            />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">
                  {userInfo?.nickname || createdBy}
                </span>
                <button
                  onClick={handleCopyAddress}
                  className="inline-flex items-center justify-center p-1 rounded-md hover:bg-gray-200 transition-colors"
                  title={`Copy ID: ${createdBy}`}
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <DocumentDuplicateIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <span className="text-gray-400 hidden sm:inline">·</span>
              <span className="text-sm text-gray-500">
                {new Date(createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="text-gray-400 hidden sm:inline">·</span>
              {getStatusBadge()}
            </div>
            <div className="flex items-center gap-2">
              {showRejectButton && isOwner && currentStatus === "PENDING" && (
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-3 py-1.5 border border-red-300 text-sm font-medium rounded-lg text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRejecting ? "Rejecting..." : "Reject"}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Reply Text Content */}
          <div className="mt-4 bg-gray-50 rounded-xl p-4">
            <p className="text-gray-600 text-base sm:text-lg break-words whitespace-pre-wrap">
              {text}
            </p>
          </div>

          {/* View Original Buzz Button */}
          {showOriginalBuzzButton && (
            <div className="mt-4">
              <Link
                href={`/buzz/${buzzId}`}
                className="inline-flex items-center justify-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-lg text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 gap-2"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                View Original Buzz
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
