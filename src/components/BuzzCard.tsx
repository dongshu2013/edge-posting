"use client";

import { ITokenInfo } from "@/app/api/get-token-info/route";
import { AuthButton } from "@/components/AuthButton";
import { twitterProjectHandle } from "@/config";
import { useAuth } from "@/hooks/useAuth";
import { fetchApi } from "@/lib/api";
import { getReplyIntentUrl } from "@/lib/twitter";
import { getChainIcon, getShortAddress } from "@/utils/commonUtils";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import { Share2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { zeroAddress } from "viem";
import kolBadge from "../../public/images/badge/badge_kol.jpg";
import FollowTwitterModal from "./FollowTwitterModal";
import ReplyLinkModal from "./ReplyLinkModal";
import { useInterval } from "@/hooks/useInterval";

export interface BuzzCardProps {
  id: string;
  tweetLink: string;
  tweetText?: string;
  instructions: string;
  tokenAmount: string;
  paymentToken: string;
  customTokenAddress: string;
  replyCount: number;
  createdBy: string;
  deadline: string;
  createdAt?: Date;
  showViewReplies?: boolean;
  isActive?: boolean;
  hasReplied?: boolean;
  rewardSettleType?: string;
  maxParticipants?: number;
  username: string;
  avatar: string;
  twitterUsername: string;
  nickname: string;
  kolStatus?: string;
  tokenInfo?: ITokenInfo;
  shareOfKols: number;
  shareOfHolders: number;
  shareOfOthers: number;
}

// Utility function to convert tweet URL to embed URL
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

const replyTemplates = [
  "[Test] Great point! ",
  "[Test] Interesting perspective! ",
  "[Test] Love this! ",
  "[Test] Absolutely agree! ",
  "[Test] This is fascinating! ",
];

export default function BuzzCard({
  id,
  tweetLink,
  tweetText,
  instructions,
  replyCount,
  createdBy,
  deadline,
  createdAt,
  showViewReplies = true,
  isActive = true,
  hasReplied = false,
  username,
  nickname,
  twitterUsername,
  avatar,
  tokenAmount,
  paymentToken,
  customTokenAddress,
  rewardSettleType,
  maxParticipants,
  kolStatus,
  tokenInfo,
  shareOfKols,
  shareOfHolders,
  shareOfOthers,
}: BuzzCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [generatedReplyText, setGeneratedReplyText] = useState("");
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  // Parse dates and ensure proper comparison
  const deadlineTime = new Date(deadline).getTime();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const isExpired = !isActive || currentTime >= deadlineTime;

  useInterval(() => {
    setCurrentTime(Date.now());
  }, 1000);

  const formatCountdown = useMemo(() => {
    const diffInSeconds = Math.floor((deadlineTime - currentTime) / 1000);
    if (diffInSeconds < 0) return null;

    let timeString = "";
    const hours = Math.floor(diffInSeconds / 3600);
    const minutes = Math.floor((diffInSeconds % 3600) / 60);
    const seconds = diffInSeconds % 60;

    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m `;
    if (seconds > 0) timeString += `${seconds}s`;

    return timeString;
  }, [currentTime, deadlineTime]);

  // Format creation time as relative time (e.g., "1h ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // If it's today, show relative time
    if (diffInSeconds < 86400) {
      if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    }

    // Otherwise show the date
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // const handleCopyAddress = async () => {
  //   try {
  //     await navigator.clipboard.writeText(createdBy);
  //     setCopied(true);
  //     setTimeout(() => setCopied(false), 2000);
  //   } catch (err) {
  //     console.error("Failed to copy address:", err);
  //   }
  // };

  const handleReplySubmit = async ({
    replyLink,
    replyText,
  }: {
    replyLink: string;
    replyText: string;
  }) => {
    try {
      const response = await fetchApi("/api/reply", {
        method: "POST",
        body: JSON.stringify({
          buzzId: id,
        }),
      });

      if (response.code === 101) {
        setIsFollowModalOpen(true);
        return;
      }

      if (response.code === 11) {
        toast.success(
          "Reply submitted successfully, please wait for it to be indexed"
        );
        return;
      }

      if (response.error) {
        throw new Error(response.error || "Failed to submit reply");
      }

      // Optionally refresh the page or update the UI
      window.location.reload();
    } catch (err) {
      throw err;
    }
  };

  const getRandomReplyText = () => {
    return "";
    // const template =
    //   replyTemplates[Math.floor(Math.random() * replyTemplates.length)];
    // return template;
  };

  const handleDirectReply = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setReplyLoading(true);
    // Get reply text from OpenAI
    const generateReplyResponse = await fetchApi("/api/generate-reply", {
      auth: true,
      method: "POST",
      body: JSON.stringify({
        instructions: instructions,
        tweetText: tweetText,
        buzzId: id,
      }),
    }).catch((err) => {
      console.error("Error generating reply:", err);
    });

    console.log("generateReplyResponse", generateReplyResponse);
    if (generateReplyResponse.code === 101) {
      setIsFollowModalOpen(true);
      setReplyLoading(false);
      return;
    }
    if (generateReplyResponse.code === 102) {
      toast.error("You have already replied to this buzz");
      setReplyLoading(false);
      return;
    }
    if (generateReplyResponse.code === 103) {
      toast.error(generateReplyResponse.error);
      setReplyLoading(false);
      return;
    }

    if (generateReplyResponse.error) {
      toast.error(generateReplyResponse.error);
      setReplyLoading(false);
      return;
    }

    const aiReplyText = generateReplyResponse?.text;
    console.log("aiReplyText", aiReplyText);

    const replyText = aiReplyText || getRandomReplyText();

    // Configure popup window dimensions
    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    // Open Twitter directly in a popup window
    window.open(
      getReplyIntentUrl(tweetLink, replyText),
      "twitter_popup",
      `width=${width},height=${height},left=${left},top=${top},popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    // Open the reply link modal to track the reply
    setGeneratedReplyText(replyText);
    setIsReplyModalOpen(true);
    setReplyLoading(false);
  };

  const renderReplyButton = () => {
    // For expired or inactive buzzes - "Reply (No Reward)" with normal style
    if (!isActive || isExpired) {
      return null;
    }

    // For active buzzes - "Reply & Earn X BUZZ" with colorful gradient
    if (!user) {
      return <AuthButton buttonText={`Reply & Earn`} variant="primary" />;
    }

    return (
      <>
        {!hasReplied && (
          <button
            id={`replyBuzz-${id}`}
            onClick={handleDirectReply}
            disabled={replyLoading}
            className="self-center inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-200"
          >
            {replyLoading
              ? "Generating..."
              : `Reply & Earn ${formatCountdown ? `(${formatCountdown})` : ""}`}
          </button>
        )}
      </>
    );
  };

  return (
    <div
      className={classNames(
        "bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300",
        showViewReplies ? " cursor-pointer" : ""
      )}
      onClick={() => {
        if (showViewReplies) {
          router.push(`/buzz/${encodeURIComponent(id)}`);
        }
      }}
    >
      <div className="p-4">
        {/* Header with creator info and price */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src={avatar}
              alt={username}
              className="w-10 h-10 rounded-full mr-2"
              width={40}
              height={40}
            />

            <div className="leading-tight">
              <div className="text-[16px] font-medium text-gray-900">
                {nickname || createdBy.substring(0, 6)}
              </div>

              <div className="text-[12px] text-gray-900">
                @{twitterUsername || createdBy.substring(0, 6)}
              </div>
            </div>

            <div className="flex items-center">
              <span className="mx-1 text-gray-500">·</span>
              {createdAt && (
                <span className="text-sm text-gray-500">
                  {formatRelativeTime(new Date(createdAt))}
                </span>
              )}
            </div>

            {kolStatus === "confirmed" && (
              <Image
                src={kolBadge}
                alt="Kol Badge"
                width={40}
                height={40}
                className="ml-2"
              />
            )}
          </div>

          <Share2
            className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(
                window.location.origin + "/buzz/" + id
              );
              toast.success("Link copied to clipboard");
            }}
          />
        </div>

        <div className="p-3 mt-3 border rounded-lg overflow-hidden mb-3">
          <div className="flex items-center justify-between h-10">
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold">
                  {tokenAmount} {tokenInfo?.symbol || paymentToken}
                </span>

                {getChainIcon(tokenInfo?.chainId) && (
                  <Image
                    src={getChainIcon(tokenInfo?.chainId)}
                    alt="Chain Icon"
                    width={16}
                    height={16}
                  />
                )}
              </div>

              {tokenInfo && tokenInfo.tokenAddress !== zeroAddress && (
                <div
                  className="mt-[2px] cursor-pointer underline text-xs text-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tokenInfo.url) {
                      window.open(tokenInfo.url, "_blank");
                    }
                  }}
                >
                  {getShortAddress(tokenInfo.tokenAddress, 6)}
                </div>
              )}
            </div>

            <div>
              {tokenInfo?.price ? (
                <span className="text-sm text-amber-500 font-semibold">
                  ${(Number(tokenInfo.price) * Number(tokenAmount)).toFixed(2)}
                </span>
              ) : (
                <span className="text-sm text-gray-500">$ N/A</span>
              )}
            </div>
          </div>

          <div className="mt-3 flex justify-between gap-3">
            {shareOfKols > 0 && (
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="text-sm text-gray-500">{shareOfKols}%</div>

                <div className="text-sm text-gray-700 font-semibold">KOLs</div>
              </div>
            )}

            {shareOfHolders > 0 && (
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="text-sm text-gray-500">{shareOfHolders}%</div>

                <div className="text-sm text-gray-700 font-semibold">
                  Holders
                </div>
              </div>
            )}

            {shareOfOthers > 0 && (
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="text-sm text-gray-500">{shareOfOthers}%</div>

                <div className="text-sm text-gray-700 font-semibold">
                  Normal Users
                </div>
              </div>
            )}
          </div>

          <div className="hidden items-center justify-between">
            <div className="text-sm flex items-center">
              <span>Settle Type:</span>
              <div className="relative inline-block ml-1 group">
                <span className="cursor-help">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 text-gray-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                    />
                  </svg>
                </span>
                <div className="absolute top-full left-0 mt-1 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 z-50">
                  <div className="relative">
                    <p>
                      <strong>Default:</strong> The total reward amount will be
                      split among all participants who complete the task, and
                      the amount will be determined by their token holdings.
                    </p>
                    <p className="mt-1">
                      <strong>Fixed:</strong> Each participant will receive a
                      fixed amount, remaining reward will be returned to the
                      creator.
                    </p>
                  </div>
                </div>
              </div>
              <span className="ml-1 text-amber-500 font-semibold capitalize">
                {rewardSettleType || "Default"}
              </span>
            </div>

            {maxParticipants && (
              <div className="text-sm">
                Max Participants:
                <span className="ml-1 text-amber-500 font-semibold">
                  {maxParticipants}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Twitter Embed */}
        <div className="mt-3 border rounded-lg overflow-hidden mb-3">
          <div className="h-72">
            <iframe
              src={getEmbedUrl(tweetLink)}
              className="w-full h-full"
              frameBorder="0"
              title="Tweet Preview"
            />
          </div>
        </div>

        {/* Instructions */}
        <div
          className="mb-3 bg-gray-50 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setShowInstructionsModal(true);
          }}
          title={instructions}
        >
          <div className="flex items-start text-sm text-gray-700">
            <LightBulbIcon className="h-4 w-4 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="h-10 overflow-hidden">
              <p className="line-clamp-2">{instructions}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center items-center">
          {/* {showViewReplies && (
            <button
              onClick={() =>
                (window.location.href = `/buzz/${encodeURIComponent(id)}`)
              }
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl shadow-sm text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
              View {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
            </button>
          )} */}
          <div className="mt-2">{renderReplyButton()}</div>
        </div>
      </div>

      <ReplyLinkModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        onSubmit={handleReplySubmit}
        tokenAmount={tokenAmount}
        initialReplyText={generatedReplyText}
      />

      <FollowTwitterModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        twitterUsername={twitterProjectHandle}
      />

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowInstructionsModal(false);
          }}
        >
          <div
            className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <LightBulbIcon className="h-5 w-5 mr-2 text-amber-500" />
                  Instructions
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInstructionsModal(false);
                  }}
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
                {instructions}
              </p>
            </div>
            <div className="px-5 py-3 bg-gray-50 flex justify-end rounded-b-xl">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInstructionsModal(false);
                }}
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
