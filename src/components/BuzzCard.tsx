'use client';

import { SparklesIcon, ChatBubbleLeftRightIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { useAccount } from 'wagmi';
import Link from 'next/link';

interface BuzzCardProps {
  id: string;
  tweetLink: string;
  instructions: string;
  context: string;
  credit: number;
  replyCount: number;
  createdBy: string;
  showViewReplies?: boolean;
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

export default function BuzzCard({ 
  id, 
  tweetLink, 
  instructions, 
  context,
  credit, 
  replyCount, 
  createdBy,
  showViewReplies = true,
}: BuzzCardProps) {
  const { address } = useAccount();
  const isOwner = address && createdBy && address.toLowerCase() === createdBy.toLowerCase();

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] border border-gray-200/80 transition-all duration-300 p-4 sm:p-6">
      <div className="flex gap-6">
        {/* Tweet Embed */}
        <div className="w-[350px] h-[250px] border border-gray-200 rounded-xl overflow-y-auto shrink-0">
          <iframe
            src={getEmbedUrl(tweetLink)}
            className="w-full h-full"
            frameBorder="0"
            title="Tweet Preview"
          />
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">
                50/100 BUZZ
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: '50%' }}
              />
            </div>
          </div>
          
          {/* Context Section */}
          <div className="bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50 rounded-xl p-4 transform transition-all duration-200 hover:scale-[1.01]">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-blue-500" />
              Context
            </h4>
            <p className="text-sm text-gray-600 break-words">
              {context || "No context provided"}
            </p>
          </div>
          
          {/* Instructions Section */}
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-4 transform transition-all duration-200 hover:scale-[1.01]">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Instructions
            </h4>
            <p className="text-sm text-gray-600 break-words">
              {instructions}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            {showViewReplies && (
              <Link
                href={`/buzz/${id}`}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                View {replyCount} Replies
              </Link>
            )}
            {!isOwner && (
              <a
                href={getReplyIntentUrl(tweetLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" />
                Reply to Earn {credit} BUZZ
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 