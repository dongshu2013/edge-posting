'use client';

import { SparklesIcon, ChatBubbleLeftRightIcon, ArrowTopRightOnSquareIcon, DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useState } from 'react';

interface BuzzCardProps {
  id: string;
  tweetLink: string;
  instructions: string;
  context: string;
  credit: number;
  replyCount: number;
  totalReplies: number;
  createdBy: string;
  deadline: string;
  createdAt?: Date;
  showViewReplies?: boolean;
  isActive?: boolean;
}

// Utility function to convert tweet URL to embed URL
const getEmbedUrl = (tweetUrl: string) => {
  try {
    const url = new URL(tweetUrl);
    const pathParts = url.pathname.split('/');
    const tweetId = pathParts[pathParts.length - 1];
    return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`;
  } catch {
    return tweetUrl;
  }
};

// Utility function to get Twitter intent URL for reply
const getReplyIntentUrl = (tweetUrl: string) => {
  try {
    const url = new URL(tweetUrl);
    const pathParts = url.pathname.split('/');
    const tweetId = pathParts[pathParts.length - 1];
    return `https://twitter.com/intent/tweet?in_reply_to=${tweetId}&text=heyhey`;
  } catch {
    return tweetUrl;
  }
};

// Utility function to format wallet address
const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function BuzzCard({ 
  id, 
  tweetLink, 
  instructions, 
  context,
  credit, 
  replyCount,
  totalReplies,
  createdBy,
  deadline,
  createdAt,
  showViewReplies = true,
  isActive = true,
}: BuzzCardProps) {
  const { address, isConnected } = useAccount();
  const isOwner = address && createdBy && address.toLowerCase() === createdBy.toLowerCase();
  
  // Parse dates and ensure proper comparison
  const deadlineTime = new Date(deadline).getTime();
  const currentTime = Date.now();
  const isExpired = !isActive || currentTime >= deadlineTime;
  
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(createdBy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const renderReplyButton = () => {
    console.log('Rendering reply button:', { isOwner, isConnected, isExpired });
    
    // Don't show button if user is the owner
    if (isOwner) {
      console.log('Not showing button - user is owner');
      return null;
    }

    // Show connect wallet button if not connected
    if (!isConnected) {
      console.log('Showing connect wallet button');
      return (
        <button
          type="button"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          onClick={() => {
            const connectButton = document.querySelector('[aria-label="Connect"]') as HTMLButtonElement;
            if (connectButton) connectButton.click();
          }}
        >
          <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
          Connect Wallet to Reply
        </button>
      );
    }

    // Show appropriate reply button based on campaign status
    console.log('Showing reply button with rewards status');
    return (
      <a
        href={getReplyIntentUrl(tweetLink)}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-white text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
          isExpired 
            ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
        }`}
      >
        <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
        {isExpired ? 'Reply (No Rewards)' : `Reply to Earn ${credit} BUZZ`}
      </a>
    );
  };

  return (
    <div className={`rounded-2xl transition-all duration-300 p-4 sm:p-6 relative ${
      isExpired 
        ? 'bg-gray-50 border border-gray-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]' 
        : 'bg-white border border-gray-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)]'
    }`}>
      {/* Remove the Campaign Status Bookmark */}

      <div className="flex flex-col lg:flex-row lg:gap-6">
        {/* Tweet Embed */}
        <div className={`w-full lg:w-[350px] border rounded-xl overflow-hidden shrink-0 mb-4 lg:mb-0 ${
          isExpired ? 'border-gray-200 opacity-75' : 'border-gray-200'
        }`}>
          <div className="aspect-[3/4]">
            <iframe
              src={getEmbedUrl(tweetLink)}
              className="w-full h-full"
              frameBorder="0"
              title="Tweet Preview"
            />
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {/* Creator Info & Timing Section */}
          <div className={`rounded-xl p-4 ${
            isExpired ? 'bg-gray-100' : 'bg-gray-50'
          }`}>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">Created by</div>
                <div className="flex items-center gap-2 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {formatAddress(createdBy)}
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    className="inline-flex items-center justify-center p-1 rounded-md hover:bg-gray-200 transition-colors"
                    title={`Copy address: ${createdBy}`}
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <DocumentDuplicateIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">Total deposit</div>
                <div className="flex items-center gap-2">
                  <SparklesIcon className={`h-5 w-5 ${
                    isExpired ? 'text-gray-400' : 'text-amber-500'
                  }`} />
                  <span className={`text-lg font-semibold ${
                    isExpired ? 'text-gray-500' : 'text-gray-900'
                  }`}>
                    {(credit * totalReplies).toFixed(2)} BUZZ
                  </span>
                </div>
              </div>
              {createdAt && (
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-500">Created on</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">Expires on</div>
                <div className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                  {new Date(deadline).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Context Section */}
          <div className={`rounded-xl p-4 transform transition-all duration-200 hover:scale-[1.01] ${
            isExpired 
              ? 'bg-gray-100'
              : 'bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50'
          }`}>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <ChatBubbleLeftRightIcon className={`h-5 w-5 mr-2 ${
                isExpired ? 'text-gray-400' : 'text-blue-500'
              }`} />
              Context
            </h4>
            <p className={`text-sm break-words ${
              isExpired ? 'text-gray-500' : 'text-gray-600'
            }`}>
              {context || "No context provided"}
            </p>
          </div>

          {/* Instructions Section */}
          <div className={`rounded-xl p-4 transform transition-all duration-200 hover:scale-[1.01] ${
            isExpired 
              ? 'bg-gray-100'
              : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50'
          }`}>
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <SparklesIcon className={`h-5 w-5 mr-2 ${
                isExpired ? 'text-gray-400' : 'text-indigo-500'
              }`} />
              Instructions
            </h4>
            <p className={`text-sm break-words ${
              isExpired ? 'text-gray-500' : 'text-gray-600'
            }`}>
              {instructions}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            {showViewReplies && (
              <Link
                href={`/buzz/${id}`}
                className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-white text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  isExpired
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                View {replyCount} Replies
              </Link>
            )}
            <div className="flex-shrink-0">
              {renderReplyButton()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 